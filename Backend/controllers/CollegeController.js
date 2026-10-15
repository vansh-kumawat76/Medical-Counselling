const College = require("../models/Colleges");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

// ================= CREATE COLLEGE =================


async function CollegeController(req, res) {
  try {
    const {
      name,
      slug,
      description,
      university,
      collegeType,
      ownership,
      establishedYear,
      location,
      website,
      contact,
      accreditation,
      ranking,
      rating,
      facilities,
      isVerified,
      status,
    } = req.body;

    // Check if college already exists
    const existingCollege = await College.findOne({ name });

    if (existingCollege) {
      return res.status(409).send({
        status: false,
        message: "College already exists",
      });
    }

    // Default logo URL for requests without an image
    let logo = req.body.logo || "";

    // Upload image to Cloudinary if provided
    if (req.file) {
      const uploadedImage = await uploadToCloudinary(
        req.file.buffer
      );

      logo = uploadedImage.url;
    }

    // Parse JSON fields when sent through FormData
    const parseField = (value) => {
      if (typeof value !== "string") return value;

      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    };

    const createCollege = await College.create({
      name,
      slug,
      logo,
      description,
      university,
      collegeType,
      ownership,
      establishedYear,
      location: parseField(location),
      website,
      contact: parseField(contact),
      accreditation: parseField(accreditation),
      ranking: parseField(ranking),
      rating: parseField(rating),
      facilities: parseField(facilities),
      isVerified,
      status,
    });

    return res.status(201).send({
      status: true,
      message: "College created successfully",
      college: createCollege,
    });
  } catch (error) {
    console.error("College creation error:", error);

    return res.status(500).send({
      status: false,
      message: "College creation failed",
      error: error.message,
    });
  }
}




// ================= GET ALL COLLEGES =================

async function GetCollegeController(req, res) {

    try {

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const skip = (page - 1) * limit;


        const colleges = await College.find()
            .skip(skip)
            .limit(limit);


        const totalColleges = await College.countDocuments();

        const totalPages = Math.ceil(totalColleges / limit);


        return res.send({

            status: true,
            message: "Colleges fetched successfully",

            currentPage: page,
            limit: limit,
            totalColleges: totalColleges,
            totalPages: totalPages,

            colleges: colleges

        });

    } catch (error) {

        console.log(error);

        return res.status(500).send({

            status: false,
            message: "Colleges data not found",
            error: error.message

        });

    }
}



// ================= EDIT COLLEGE =================

async function EditCollegeHandler(req, res) {
 console.log("========== ADD COLLEGE ==========");
    console.log("COLLEGE BODY:", req.body);

    try {

        const {
            id,
            name,
            slug,
            logo,
            description,
            university,
            collegeType,
            ownership,
            establishedYear,
            location,
            website,
            contact,
            accreditation,
            ranking,
            rating,
            facilities,
            isVerified,
            status
        } = req.body;


        const college = await College.findById(id);

        if (!college) {

            return res.send({
                status: false,
                message: "College not found"
            });

        }


        const updatedCollege = await College.findByIdAndUpdate(

            id,

            {
                name,
                slug,
                logo,
                description,
                university,
                collegeType,
                ownership,
                establishedYear,
                location,
                website,
                contact,
                accreditation,
                ranking,
                rating,
                facilities,
                isVerified,
                status
            },

            {
                new: true
            }

        );


        return res.send({

            status: true,
            message: "College updated successfully",
            college: updatedCollege

        });

    } catch (error) {

        console.log(error);

        return res.status(500).send({

            status: false,
            message: "College update failed",
            error: error.message

        });

    }
}



// ================= DELETE COLLEGE =================

async function DeleteCollegeHandler(req, res) {

    try {

        const { id } = req.body;


        const deletedCollege = await College.findByIdAndDelete(id);


        if (!deletedCollege) {

            return res.send({

                status: false,
                message: "College not found"

            });

        }


        return res.send({

            status: true,
            message: "College deleted successfully"

        });

    } catch (error) {

        console.log(error);

        return res.status(500).send({

            status: false,
            message: "College deletion failed",
            error: error.message

        });

    }
}



// ================= SEARCH + FILTER + SORT + PAGINATION =================

async function SearchCollegeController(req, res) {

    try {

        const search = String(req.query.search || "");

        const collegeType = req.query.collegeType || "";

        const status = req.query.status || "";

        const sortBy = req.query.sortBy || "createdAt";

        const order = req.query.order === "desc" ? -1 : 1;


        const page = Number(req.query.page) || 1;

        const limit = Number(req.query.limit) || 10;

        const skip = (page - 1) * limit;


        // Search

        let filter = {

            $or: [

                {
                    name: {
                        $regex: search,
                        $options: "i"
                    }
                },

                {
                    slug: {
                        $regex: search,
                        $options: "i"
                    }
                },

                {
                    "location.city": {
                        $regex: search,
                        $options: "i"
                    }
                },

                {
                    "location.state": {
                        $regex: search,
                        $options: "i"
                    }
                }

            ]

        };


        // College type filter

        if (collegeType) {

            filter.collegeType = collegeType;

        }


        // Status filter

        if (status) {

            filter.status = status;

        }


        const totalColleges = await College.countDocuments(filter);


        const colleges = await College.find(filter)

            .sort({
                [sortBy]: order
            })

            .skip(skip)

            .limit(limit);


        const totalPages = Math.ceil(totalColleges / limit);


        return res.send({

            status: true,

            message: "Colleges fetched successfully",

            currentPage: page,

            limit: limit,

            totalColleges: totalColleges,

            totalPages: totalPages,

            colleges: colleges

        });

    } catch (error) {

        console.log(error);

        return res.status(500).send({

            status: false,

            message: "College search failed",

            error: error.message

        });

    }
}


module.exports = {

    CollegeController,

    GetCollegeController,

    EditCollegeHandler,

    DeleteCollegeHandler,

    SearchCollegeController

};