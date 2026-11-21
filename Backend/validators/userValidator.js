
const { body } = require("express-validator");

const hasField = (req, field) =>
  Object.prototype.hasOwnProperty.call(req.body, field);

const isValidObjectId = (value) =>
  /^[a-fA-F0-9]{24}$/.test(value);

const isValidName = (value) =>
  /^[\p{L}\p{M}][\p{L}\p{M}\s'.-]*$/u.test(value);

const isValidPhone = (value) => {
  const cleaned = value.replace(/[\s()-]/g, "");
  return /^(\+91)?[6-9]\d{9}$/.test(cleaned);
};

const isValidYear = (value) =>
  Number.isInteger(Number(value)) &&
  Number(value) >= 1900 &&
  Number(value) <= new Date().getFullYear();

const requiredText = (field, label, section, max = 100) =>
  body(field)
    .if((value, { req }) => hasField(req, section))
    .isString()
    .withMessage(`${label} must be text.`)
    .bail()
    .trim()
    .notEmpty()
    .withMessage(`${label} is required.`)
    .bail()
    .isLength({ min: 1, max })
    .withMessage(`${label} cannot exceed ${max} characters.`);

const requiredEmail = (field, label, section) =>
  body(field)
    .if((value, { req }) => hasField(req, section))
    .trim()
    .notEmpty()
    .withMessage(`${label} is required.`)
    .bail()
    .isEmail()
    .withMessage(`Please enter a valid ${label.toLowerCase()}.`);

const requiredPhone = (field, label, section) =>
  body(field)
    .if((value, { req }) => hasField(req, section))
    .isString()
    .withMessage(`${label} must be text.`)
    .bail()
    .trim()
    .notEmpty()
    .withMessage(`${label} is required.`)
    .bail()
    .custom(isValidPhone)
    .withMessage(`${label} must be a valid Indian mobile number.`);

const requiredNumber = (
  field,
  label,
  section,
  min = 0,
  max = Number.MAX_SAFE_INTEGER
) =>
  body(field)
    .if((value, { req }) => hasField(req, section))
    .notEmpty()
    .withMessage(`${label} is required.`)
    .bail()
    .isFloat({ min, max })
    .withMessage(`${label} must be between ${min} and ${max}.`);

const requiredObjectId = (field, label, section) =>
  body(field)
    .if((value, { req }) => hasField(req, section))
    .notEmpty()
    .withMessage(`${label} is required.`)
    .bail()
    .custom(isValidObjectId)
    .withMessage(`Please select a valid ${label.toLowerCase()}.`);

// ================= REGISTER VALIDATION =================

const registerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required.")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters."),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .bail()
    .isEmail()
    .withMessage("Please enter a valid email."),

  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .bail()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters."),
];

// ================= COUNSELLOR VALIDATION =================

const counsellorValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .bail()
    .isEmail()
    .withMessage("Please enter a valid email."),

  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .bail()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters."),
];

// ================= COUNSELLING REQUEST VALIDATION =================

const counsellingRequestValidator = [
  body("academicYear")
    .trim()
    .notEmpty()
    .withMessage("Academic Year is required."),

  body("admissionLevel")
    .notEmpty()
    .withMessage("Admission Level is required.")
    .bail()
    .isIn(["UG", "PG", "Diploma", "Doctorate", "Other"])
    .withMessage("Please select a valid Admission Level."),

  body("preferredLocations")
    .isArray({ min: 1 })
    .withMessage("At least one preferred location is required."),

  body("preferredLocations.0.city")
    .isString()
    .withMessage("Preferred City must be text.")
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
    .bail()
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

// ================= STUDENT PROFILE VALIDATION =================

const studentProfileValidator = [

  // PERSONAL DETAILS OBJECT

  body("personalDetails")
    .if((value, { req }) => hasField(req, "personalDetails"))
    .isObject()
    .withMessage("Personal details must be a valid object."),

  // STUDENT NAME

  requiredText(
    "personalDetails.firstName",
    "First Name",
    "personalDetails",
    50
  ).custom((value) => {
    if (!isValidName(value)) {
      throw new Error("First Name contains invalid characters.");
    }
    return true;
  }),

  requiredText(
    "personalDetails.lastName",
    "Last Name",
    "personalDetails",
    50
  ).custom((value) => {
    if (!isValidName(value)) {
      throw new Error("Last Name contains invalid characters.");
    }
    return true;
  }),

  requiredEmail(
    "personalDetails.personalEmail",
    "Personal Email",
    "personalDetails"
  ),

  requiredPhone(
    "personalDetails.mobile",
    "Mobile Number",
    "personalDetails"
  ),

  requiredPhone(
    "personalDetails.alternateMobile",
    "Alternate Mobile Number",
    "personalDetails"
  ),

  // ADDRESS

  requiredText(
    "personalDetails.currentAddress",
    "Current Address",
    "personalDetails",
    250
  ),

  requiredText(
    "personalDetails.permanentAddress",
    "Permanent Address",
    "personalDetails",
    250
  ),

  body("personalDetails.pinCode")
    .if((value, { req }) => hasField(req, "personalDetails"))
    .isString()
    .withMessage("PIN Code must be text.")
    .bail()
    .trim()
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage("Please enter a valid 6-digit Indian PIN Code."),

  // FATHER AND MOTHER

  ...["father", "mother"].flatMap((parent) => {
    const prefix = `personalDetails.${parent}`;

    return [
      body(prefix)
        .if((value, { req }) => hasField(req, "personalDetails"))
        .isObject()
        .withMessage(`${parent} details must be a valid object.`),

      requiredText(
        `${prefix}.firstName`,
        `${parent} First Name`,
        "personalDetails",
        50
      ),

      requiredText(
        `${prefix}.lastName`,
        `${parent} Last Name`,
        "personalDetails",
        50
      ),

      requiredPhone(
        `${prefix}.phone`,
        `${parent} Phone`,
        "personalDetails"
      ),

      requiredPhone(
        `${prefix}.alternatePhone`,
        `${parent} Alternate Phone`,
        "personalDetails"
      ),

      requiredEmail(
        `${prefix}.email`,
        `${parent} Email`,
        "personalDetails"
      ),

      requiredText(
        `${prefix}.occupation`,
        `${parent} Occupation`,
        "personalDetails",
        100
      ),
    ];
  }),

  // CASTE DETAILS

  body("personalDetails.casteDetails")
    .if((value, { req }) => hasField(req, "personalDetails"))
    .isObject()
    .withMessage("Caste details must be a valid object."),

  requiredObjectId(
    "personalDetails.casteDetails.centralCaste",
    "Central Caste",
    "personalDetails"
  ),

  requiredObjectId(
    "personalDetails.casteDetails.stateCaste",
    "State Caste",
    "personalDetails"
  ),

  // BASIC DETAILS

  body("dob")
    .if((value, { req }) => hasField(req, "personalDetails"))
    .notEmpty()
    .withMessage("Date of Birth is required.")
    .bail()
    .isISO8601({ strict: true })
    .withMessage("Please enter a valid Date of Birth.")
    .bail()
    .custom((value) => {
      const date = new Date(value);

      if (
        Number.isNaN(date.getTime()) ||
        date.getTime() > Date.now()
      ) {
        throw new Error("Date of Birth cannot be in the future.");
      }

      return true;
    }),

  body("gender")
    .if((value, { req }) => hasField(req, "personalDetails"))
    .notEmpty()
    .withMessage("Gender is required.")
    .bail()
    .isIn(["male", "female", "other"])
    .withMessage("Please select a valid gender."),

  ...["city", "state", "country"].map((field) =>
    requiredText(field, field, "personalDetails", 100)
  ),

  // ACADEMIC DETAILS

  
  // ================= ACADEMIC DETAILS =================

  body("academicDetails")
    .if((value, { req }) => hasField(req, "academicDetails"))
    .isObject()
    .withMessage("Academic details must be a valid object."),

  ...[
    ["tenth", "10th"],
    ["twelfth", "12th"],
    ["graduation", "Graduation"],
  ].flatMap(([level, label]) => {
    const prefix = `academicDetails.${level}`;

    const fields = [];

    // Board only for 10th and 12th
    if (level === "tenth" || level === "twelfth") {
      fields.push(
        requiredText(
          `${prefix}.board`,
          `${label} Board`,
          "academicDetails",
          150
        )
      );
    }

    // Percentage for all three
    fields.push(
      requiredNumber(
        `${prefix}.percentage`,
        `${label} Percentage`,
        "academicDetails",
        0,
        100
      )
    );

    // Passing Year for all three
    fields.push(
      body(`${prefix}.passingYear`)
        .if((value, { req }) =>
          hasField(req, "academicDetails")
        )
        .notEmpty()
        .withMessage(`${label} Passing Year is required.`)
        .bail()
        .custom(isValidYear)
        .withMessage(`Please enter a valid ${label} Passing Year.`)
    );

    // 12th Stream
    if (level === "twelfth") {
      fields.push(
        requiredText(
          `${prefix}.stream`,
          "12th Stream",
          "academicDetails",
          100
        )
      );
    }

    // Graduation College and Course
    if (level === "graduation") {
      fields.push(
        requiredText(
          `${prefix}.college`,
          "Graduation College",
          "academicDetails",
          150
        ),
        requiredText(
          `${prefix}.course`,
          "Graduation Course",
          "academicDetails",
          150
        )
      );
    }

    return fields;
  }),

  // ENTRANCE EXAMS

  body("entranceExams")
    .if((value, { req }) => hasField(req, "entranceExams"))
    .isArray({ min: 1 })
    .withMessage("At least one entrance exam is required."),

  body("entranceExams.*.exam")
    .if((value, { req }) => hasField(req, "entranceExams"))
    .notEmpty()
    .withMessage("Entrance Exam is required.")
    .bail()
    .custom(isValidObjectId)
    .withMessage("Please select a valid Entrance Exam."),

  body("entranceExams.*.score")
    .if((value, { req }) => hasField(req, "entranceExams"))
    .notEmpty()
    .withMessage("Exam Score is required.")
    .bail()
    .isFloat({ min: 0 })
    .withMessage("Exam Score must be a valid non-negative number."),

  body("entranceExams.*.percentile")
    .if((value, { req }) => hasField(req, "entranceExams"))
    .notEmpty()
    .withMessage("Exam Percentile is required.")
    .bail()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Percentile must be between 0 and 100."),

  body("entranceExams.*.rank")
    .if((value, { req }) => hasField(req, "entranceExams"))
    .notEmpty()
    .withMessage("Exam Rank is required.")
    .bail()
    .isInt({ min: 1 })
    .withMessage("Rank must be a positive whole number."),

  body("entranceExams.*.year")
    .if((value, { req }) => hasField(req, "entranceExams"))
    .notEmpty()
    .withMessage("Exam Year is required.")
    .bail()
    .custom(isValidYear)
    .withMessage("Please enter a valid Exam Year."),

  // PREFERRED COURSES

  body("preferredCourses")
    .if((value, { req }) => hasField(req, "preferredCourses"))
    .isArray({ min: 1 })
    .withMessage("Please select at least one preferred course."),

  body("preferredCourses.*")
    .if((value, { req }) => hasField(req, "preferredCourses"))
    .notEmpty()
    .withMessage("Course selection cannot be empty.")
    .bail()
    .custom(isValidObjectId)
    .withMessage("Please select a valid course."),

  // PREFERRED LOCATIONS

  body("preferredLocations")
    .if((value, { req }) => hasField(req, "preferredLocations"))
    .isArray({ min: 1 })
    .withMessage("Please select at least one preferred location."),

  body("preferredLocations.*")
    .if((value, { req }) => hasField(req, "preferredLocations"))
    .isString()
    .withMessage("Location must be text.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Location cannot be empty.")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Location cannot exceed 100 characters."),

  // BUDGET

  body("budget")
    .if((value, { req }) => hasField(req, "budget"))
    .isObject()
    .withMessage("Budget must be a valid object."),

  body("budget.min")
    .if((value, { req }) => hasField(req, "budget"))
    .notEmpty()
    .withMessage("Minimum Budget is required.")
    .bail()
    .isFloat({ min: 0 })
    .withMessage("Minimum Budget must be a valid non-negative number."),

  body("budget.max")
    .if((value, { req }) => hasField(req, "budget"))
    .notEmpty()
    .withMessage("Maximum Budget is required.")
    .bail()
    .isFloat({ min: 0 })
    .withMessage("Maximum Budget must be a valid non-negative number.")
    .bail()
    .custom((value, { req }) => {
      const min = req.body.budget?.min;

      if (
        min === undefined ||
        min === null ||
        min === "" ||
        Number(value) < Number(min)
      ) {
        throw new Error(
          "Maximum Budget cannot be less than Minimum Budget."
        );
      }

      return true;
    }),
];

module.exports = {
  registerValidator,
  counsellorValidator,
  counsellingRequestValidator,
  studentProfileValidator,
};
