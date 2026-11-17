
const Students = require("../models/Students");
const Role = require("../models/Role");

const getDashboardOverview = async (req, res) => {
  try {
    const studentRole = await Role.findOne({ role: "Student" }).select("_id");

    if (!studentRole) {
      return res.status(404).json({
        status: false,
        message: "Student role not found.",
      });
    }

    const studentFilter = {
      role: studentRole._id,
    };

    // Date ranges
    const endDate = new Date();

    const startDate = new Date(
      endDate.getFullYear(),
      endDate.getMonth() - 11,
      1
    );

    const currentMonthStart = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      1
    );

    const nextMonthStart = new Date(
      endDate.getFullYear(),
      endDate.getMonth() + 1,
      1
    );

    const previousMonthStart = new Date(
      endDate.getFullYear(),
      endDate.getMonth() - 1,
      1
    );

    const [
      totalStudents,
      activeStudents,
      inactiveStudents,
      pendingStudents,
      recentStudents,
      registrationData,
      currentMonthStudents,
      previousMonthStudents,
    ] = await Promise.all([
      Students.countDocuments(studentFilter),

      Students.countDocuments({
        ...studentFilter,
        status: "active",
      }),

      Students.countDocuments({
        ...studentFilter,
        status: "inactive",
      }),

      Students.countDocuments({
        ...studentFilter,
        status: "pending",
      }),

      Students.find(studentFilter)
        .select("-password")
        .populate("role", "role")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      Students.aggregate([
        {
          $match: {
            ...studentFilter,
            createdAt: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            total: { $sum: 1 },
          },
        },
      ]),

      Students.countDocuments({
        ...studentFilter,
        createdAt: {
          $gte: currentMonthStart,
          $lt: nextMonthStart,
        },
      }),

      Students.countDocuments({
        ...studentFilter,
        createdAt: {
          $gte: previousMonthStart,
          $lt: currentMonthStart,
        },
      }),
    ]);

    // Monthly registrations
    const registrationMap = new Map();

    registrationData.forEach((item) => {
      const key = `${item._id.year}-${item._id.month}`;
      registrationMap.set(key, item.total);
    });

    const monthlyRegistrations = Array.from(
      { length: 12 },
      (_, index) => {
        const date = new Date(
          startDate.getFullYear(),
          startDate.getMonth() + index,
          1
        );

        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;

        return {
          month: date.toLocaleString("en-US", {
            month: "short",
          }),
          year: date.getFullYear(),
          total: registrationMap.get(key) || 0,
        };
      }
    );

    // Growth calculation
    const growthPercentage =
      previousMonthStudents === 0
        ? null
        : Number(
            (
              ((currentMonthStudents - previousMonthStudents) /
                previousMonthStudents) *
              100
            ).toFixed(1)
          );

    const growthDirection =
      previousMonthStudents === 0
        ? currentMonthStudents > 0
          ? "new"
          : "neutral"
        : currentMonthStudents > previousMonthStudents
        ? "up"
        : currentMonthStudents < previousMonthStudents
        ? "down"
        : "neutral";

    // Recent student registration activities
    const recentActivities = recentStudents.map((student) => ({
      _id: student._id,
      type: "student_registered",
      title: "New student registered",
      description: `${student.name || "A student"} registered on the platform`,
      studentName: student.name || "Student",
      createdAt: student.createdAt,
    }));

    return res.status(200).json({
      status: true,
      message: "Dashboard data retrieved successfully.",
      data: {
        stats: {
          totalStudents,
          activeStudents,
          inactiveStudents,
          pendingStudents,
        },
        growth: {
          currentMonthStudents,
          previousMonthStudents,
          growthPercentage,
          growthDirection,
        },
        recentStudents,
        monthlyRegistrations,
        recentActivities,
      },
    });
  } catch (error) {
    console.error("Dashboard Overview Error:", error);

    return res.status(500).json({
      status: false,
      message: "Unable to retrieve dashboard data.",
    });
  }
};

module.exports = {
  getDashboardOverview,
};
