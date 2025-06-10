import jobsModel from "../models/jobsModel.js";
import mongoose from "mongoose";

import moment from "moment";
//create job
export const createJobController = async (req, res, next) => {
  const { company, position } = req.body;
  if (!company || !position) {
    next(`please provide all fields`);
  }

  req.body.createdBy = req.user.userId;
  // console.log("dsff", req.user);
  const job = await jobsModel.create(req.body);
  res.status(201).json({ job });
};

//get jobs
export const getAllJobsController = async (req, res, next) => {
  const { status, workType, search, sort } = req.query;
  //consdition for searching filters
  const queryObject = {
    createdBy: req.user.userId,
  };
  //console.log("createdBy:", req.user.userId);
  if (status && status !== "all") {
    queryObject.status = status;
  }

  if (workType && workType !== "all") {
    queryObject.workType = workType;
  }
  if (search) {
    queryObject.position = { $regex: search, $options: "i" };
  }
  console.log("final query object", queryObject);
  let queryResult = jobsModel.find(queryObject);
  //sorting
  if (sort === "latest") {
    queryResult = queryResult.sort("-createdAt");
  }
  if (sort === "oldest") {
    queryResult = queryResult.sort("createdAt");
  }
  if (sort === "a-z") {
    queryResult = queryResult.sort("position");
  }
  if (sort === "z-a") {
    queryResult = queryResult.sort("-position");
  }
  //pagination
  const page = Number(req.query.page) || 1;

  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  //console.log(skip);

  queryResult = queryResult.skip(skip).limit(limit);
  console.log(queryObject);

  //jobs count
  const totalJobs = await jobsModel.countDocuments(queryResult);
  const numOfPage = Math.ceil(totalJobs / limit);

  const jobs = await queryResult;

  res.status(200).json({
    totalJobs,
    jobs,
    numOfPage,
  });
};

//update jobs
export const updateJobController = async (req, res, next) => {
  const { id } = req.params;
  const { company, position } = req.body;

  //validation
  if (!company || !position) {
    next(`please provide all fields`);
  }
  //find job
  const job = await jobsModel.findOne({ _id: id });
  //validation
  if (!job) {
    next(`no jobs with this id  ${id}`);
  }
  if (!req.user.userId === job.createdBy) {
    next(`you are not authorized to update this job`);
    return;
  }
  const updateJob = await jobsModel.findOneAndUpdate({ _id: id }, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({ updateJob });
};

////delete jobs
export const deleteJobController = async (req, res, next) => {
  const { id } = req.params;
  //find job
  const job = await jobsModel.findOne({ _id: id });
  //validation
  if (!job) {
    next(`no job found with this id ${id}`);
  }
  if (!req.user.userId === job.createdBy) {
    next(`you are not authorized to delete this job`);
    return;
  }
  await job.deleteOne();
  res.status(200).json({ message: "Sucess,Job Deleted" });
};

//jobs stats anf filter

export const jobStatsController = async (req, res) => {
  const stats = await jobsModel.aggregate([
    {
      $match: {
        createdBy: new mongoose.Types.ObjectId(req.user.userId),
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);
  const defaultStats = {
    pending: stats.pending || 0,
    reject: stats.reject || 0,
    interview: stats.interview || 0,
  };
  //monthly yearly stats
  let monthlyApplication = await jobsModel.aggregate([
    {
      $match: {
        createdBy: new mongoose.Types.ObjectId(req.user.userId),
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },

        count: { $sum: 1 },
      },
    },
  ]);
  monthlyApplication = monthlyApplication
    .map((item) => {
      const {
        _id: { year, month },
        count,
      } = item;
      const date = moment()
        .month(month - 1)
        .year(year)
        .format("MMM Y");
      return { date, count };
    })
    .reverse();

  res
    .status(200)
    .json({ totalJob: stats.length, defaultStats, monthlyApplication });
};
