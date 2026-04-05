const Group = require('../models/Group');
const User = require('../models/User');

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
exports.createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;
    
    // Always include the creator in the group
    let groupMembers = members || [];
    if (!groupMembers.includes(req.user._id.toString())) {
      groupMembers.push(req.user._id);
    }

    const group = await Group.create({
      name,
      members: groupMembers
    });

    // Add group to all members' user document
    await User.updateMany(
      { _id: { $in: groupMembers } },
      { $push: { groups: group._id } }
    );

    const populatedGroup = await Group.findById(group._id).populate('members', 'name email');
    res.status(201).json(populatedGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all groups for a user
// @route   GET /api/groups
// @access  Private
exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('members', 'name email')
      .sort({ createdAt: -1 });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get group by ID
// @route   GET /api/groups/:id
// @access  Private
exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'name email')
      .populate({
        path: 'expenses',
        populate: [
          { path: 'paidBy', select: 'name' },
          { path: 'participants.user', select: 'name' }
        ]
      });
      
    if (group && group.members.some(member => member._id.equals(req.user._id))) {
      res.json(group);
    } else {
      res.status(404).json({ message: 'Group not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add member to group
// @route   POST /api/groups/add-member
// @access  Private
exports.addMember = async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
      
      await User.findByIdAndUpdate(userId, {
        $push: { groups: groupId }
      });
    }

    const updatedGroup = await Group.findById(groupId).populate('members', 'name email');
    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
