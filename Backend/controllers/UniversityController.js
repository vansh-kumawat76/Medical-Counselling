const University = require("../models/University")
async function createUniversity(req,res) {
    try {
const {name,shortName,logo,type,establishedYear, location, website} = req.body
console.log(name,shortName,logo,type,establishedYear, location, website);

const university = new University({
     name,
    shortName,
    logo,
    type,
    establishedYear,
    location,
    website
})
await university.save();
res.status(201).send({
message : "University created successfully",
university
})
}catch(error) {
    res.status(500).send({
       message : "Error creating university",
       error : error.message
    })
}
}


async function GetUniversity(req, res) {
  try {
    const getUniversity = await University.find()
      .sort({
        createdAt: -1,
        _id: -1,
      });

    res.status(200).send({
      status: true,
      message: "Universities fetched successfully",
      universities: getUniversity,
    });
  } catch (error) {
    console.error("Get University Error:", error);

    res.status(500).send({
      status: false,
      message: "Error fetching universities",
      error: error.message,
    });
  }
}


async function updateUniversity(req, res) {
  try {
    const updatedUniversity = await University.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUniversity) {
      return res.status(404).send({
        message: "University not found",
      });
    }

    res.status(200).send({
      message: "University updated successfully",
      university: updatedUniversity,
    });
  } catch (error) {
    res.status(500).send({
      message: "Error updating university",
      error: error.message,
    });
  }
}

async function deleteUniversity(req, res) {
  try {
    const deletedUniversity = await University.findByIdAndDelete(
      req.params.id
    );

    if (!deletedUniversity) {
      return res.status(404).send({
        message: "University not found",
      });
    }

    res.status(200).send({
      message: "University deleted successfully",
    });
  } catch (error) {
    res.status(500).send({
      message: "Error deleting university",
      error: error.message,
    });
  }
}
module.exports = {
    createUniversity,
    GetUniversity,
    updateUniversity,
    deleteUniversity
}