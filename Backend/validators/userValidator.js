
const { body } = require("express-validator");

// Register Validation
const registerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

// Counsellor Validation
const counsellorValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

// Counselling Request Validation
const counsellingRequestValidator = [
  body("academicYear")
    .trim()
    .notEmpty()
    .withMessage("Academic Year is required."),

  body("admissionLevel")
    .notEmpty()
    .withMessage("Admission Level is required.")
    .isIn(["UG", "PG", "Diploma", "Doctorate", "Other"])
    .withMessage("Please select a valid Admission Level."),

  body("preferredLocations")
    .isArray({ min: 1 })
    .withMessage("Preferred City is required."),

  body("preferredLocations.0.city")
    .isString()
    .withMessage("Preferred City is required.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Preferred City is required."),

  body("budget.min")
    .notEmpty()
    .withMessage("Minimum Budget is required.")
    .bail()
    .isFloat({ min: 0 })
    .withMessage("Minimum Budget must be a valid non-negative number."),

  body("budget.max")
    .notEmpty()
    .withMessage("Maximum Budget is required.")
    .bail()
    .isFloat({ min: 0 })
    .withMessage("Maximum Budget must be a valid non-negative number.")
    .bail()
    .custom((value, { req }) => {
      if (Number(value) < Number(req.body.budget?.min)) {
        throw new Error(
          "Maximum Budget cannot be less than Minimum Budget."
        );
      }
      return true;
    }),

  body("counsellingMode")
    .notEmpty()
    .withMessage("Counselling Mode is required.")
    .isIn(["phone", "video", "in_person", "chat"])
    .withMessage("Please select a valid Counselling Mode."),

  body("preferredTime.date")
    .notEmpty()
    .withMessage("Preferred Counselling Date is required.")
    .bail()
    .isISO8601()
    .withMessage("Please enter a valid counselling date.")
    .bail()
    .custom((value) => {
      if (new Date(value).getTime() <= Date.now()) {
        throw new Error("Counselling date must be in the future.");
      }
      return true;
    }),
];

// Student Profile Validation
// Partial update supported: only validates fields sent by frontend.

const isValidObjectId = (value) => /^[a-fA-F0-9]{24}$/.test(value);

// Personal Details
const studentProfileValidator = [
  body("personalDetails")
    .optional()
    .isObject()
    .withMessage("Personal details must be a valid object."),

  body("personalDetails.firstName")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("First name must be text.")
    .bail()
    .trim()
    .isLength({ max: 50 })
    .withMessage("First name cannot exceed 50 characters."),

  body("personalDetails.lastName")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Last name must be text.")
    .bail()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Last name cannot exceed 50 characters."),

  body("personalDetails.personalEmail")
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage("Please enter a valid personal email."),

  body("personalDetails.mobile")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Mobile number must be text.")
    .bail()
    .matches(/^[0-9+\-\s()]{7,20}$/)
    .withMessage("Please enter a valid mobile number."),

  body("personalDetails.alternateMobile")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Alternate mobile number must be text.")
    .bail()
    .matches(/^[0-9+\-\s()]{7,20}$/)
    .withMessage("Please enter a valid alternate mobile number."),

  body("personalDetails.pinCode")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("PIN code must be text.")
    .bail()
    .matches(/^[0-9]{4,10}$/)
    .withMessage("Please enter a valid PIN code."),

  // Father and Mother Details
  ...["father", "mother"].flatMap((parent) => [
    body(`personalDetails.${parent}`)
      .optional()
      .isObject()
      .withMessage(`${parent} details must be a valid object.`),

    body(`personalDetails.${parent}.email`)
      .optional({ checkFalsy: true })
      .isEmail()
      .withMessage(`Please enter a valid ${parent} email.`),

    body(`personalDetails.${parent}.phone`)
      .optional({ checkFalsy: true })
      .matches(/^[0-9+\-\s()]{7,20}$/)
      .withMessage(`Please enter a valid ${parent} phone number.`),

    body(`personalDetails.${parent}.alternatePhone`)
      .optional({ checkFalsy: true })
      .matches(/^[0-9+\-\s()]{7,20}$/)
      .withMessage(`Please enter a valid ${parent} alternate phone number.`),
  ]),

  // Caste Details
  body("personalDetails.casteDetails")
    .optional()
    .isObject()
    .withMessage("Caste details must be a valid object."),

  body("personalDetails.casteDetails.centralCaste")
    .optional({ checkFalsy: true })
    .custom((value) => isValidObjectId(value))
    .withMessage("Please select a valid central caste."),

  body("personalDetails.casteDetails.stateCaste")
    .optional({ checkFalsy: true })
    .custom((value) => isValidObjectId(value))
    .withMessage("Please select a valid state caste."),

  // Basic Details
  body("dob")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Please enter a valid date of birth.")
    .bail()
    .custom((value) => new Date(value) <= new Date())
    .withMessage("Date of birth cannot be in the future."),

  body("gender")
    .optional({ checkFalsy: true })
    .isIn(["male", "female", "other"])
    .withMessage("Please select a valid gender."),

  body("city")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("City must be text."),

  body("state")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("State must be text."),

  body("country")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Country must be text."),

  // Academic Details
  body("academicDetails")
    .optional()
    .isObject()
    .withMessage("Academic details must be a valid object."),

  ...[
    "tenth.percentage",
    "twelfth.percentage",
    "graduation.percentage",
  ].map((field) =>
    body(`academicDetails.${field}`)
      .optional({ values: "undefined" })
      .custom((value) => {
        if (value === "" || value === null) return true;
        return Number.isFinite(Number(value)) &&
          Number(value) >= 0 &&
          Number(value) <= 100;
      })
      .withMessage("Percentage must be between 0 and 100.")
  ),

  ...[
    "tenth.passingYear",
    "twelfth.passingYear",
    "graduation.passingYear",
  ].map((field) =>
    body(`academicDetails.${field}`)
      .optional({ values: "undefined" })
      .custom((value) => {
        if (value === "" || value === null) return true;
        return Number.isInteger(Number(value)) &&
          Number(value) >= 1900 &&
          Number(value) <= new Date().getFullYear() + 10;
      })
      .withMessage("Please enter a valid passing year.")
  ),

  // Entrance Exams
  body("entranceExams")
    .optional()
    .isArray()
    .withMessage("Entrance exams must be an array."),

  body("entranceExams.*.exam")
    .optional({ checkFalsy: true })
    .custom((value) => isValidObjectId(value))
    .withMessage("Please select a valid entrance exam."),

  ...["score", "percentile", "rank", "year"].map((field) =>
    body(`entranceExams.*.${field}`)
      .optional({ values: "undefined" })
      .custom((value) => {
        if (value === "" || value === null) return true;
        return Number.isFinite(Number(value)) && Number(value) >= 0;
      })
      .withMessage(`${field} must be a valid non-negative number.`)
  ),

  // Preferred Courses
  body("preferredCourses")
    .optional()
    .isArray()
    .withMessage("Preferred courses must be an array."),

  body("preferredCourses.*")
    .optional({ checkFalsy: true })
    .custom((value) => isValidObjectId(value))
    .withMessage("Please select a valid preferred course."),

  // Preferred Locations
  body("preferredLocations")
    .optional()
    .isArray()
    .withMessage("Preferred locations must be an array."),

  body("preferredLocations.*")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Each preferred location must be text.")
    .bail()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Location name cannot exceed 100 characters."),

  // Budget
  body("budget")
    .optional()
    .isObject()
    .withMessage("Budget must be a valid object."),

  body("budget.min")
    .optional({ values: "undefined" })
    .custom((value) => {
      if (value === "" || value === null) return true;
      return Number.isFinite(Number(value)) && Number(value) >= 0;
    })
    .withMessage("Minimum budget must be a valid non-negative number."),

  body("budget.max")
    .optional({ values: "undefined" })
    .custom((value) => {
      if (value === "" || value === null) return true;
      return Number.isFinite(Number(value)) && Number(value) >= 0;
    })
    .withMessage("Maximum budget must be a valid non-negative number.")
    .bail()
    .custom((value, { req }) => {
      const min = req.body.budget?.min;

      if (
        value === "" ||
        value === null ||
        min === undefined ||
        min === "" ||
        min === null
      ) {
        return true;
      }

      return Number(value) >= Number(min);
    })
    .withMessage("Maximum budget cannot be less than minimum budget."),
];

module.exports = {
  registerValidator,
  counsellorValidator,
  counsellingRequestValidator,
  studentProfileValidator,
};
