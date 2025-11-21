// components/CoursesDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";
import {
  useGetAllCourses,
  useGetTutorCourses,
  useEnrollInCourse,
  useUsers,
  UserRole,
  Course,
  useCreateCourse,
  useGetCourse
} from "@/utils/useContractHooks";

// Separate component for individual course to properly use hooks
function CourseCard({
  courseId,
  index,
  isTutor,
  enrolling,
  onEnroll,
  userAddress
}: {
  courseId: bigint;
  index: number;
  isTutor: boolean;
  enrolling: boolean;
  onEnroll: (courseId: bigint) => void;
  userAddress: `0x${string}` | undefined;
}) {
  const { data: course, isLoading } = useGetCourse(courseId);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-[#F5F5DC] p-6 rounded-xl border-2 border-[#8D6E63]"
      >
        <div className="text-[#5D4037]">Loading course...</div>
      </motion.div>
    );
  }

  if (!course || !course.isActive) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-[#F5F5DC] p-6 rounded-xl border-2 border-[#8D6E63] hover:border-[#5D4037] transition-colors"
    >
      <h3 className="text-xl font-semibold text-[#5D4037] mb-2">
        {course.title}
      </h3>
      <p className="text-[#6D4C41] mb-2">Tutor: {course.tutorName}</p>
      <p className="text-[#8D6E63] text-sm mb-3 font-mono">
        {`${course.tutor.slice(0, 6)}...${course.tutor.slice(-4)}`}
      </p>

      <div className="inline-block px-3 py-1 rounded-full text-sm mb-4 bg-[#F5F5DC] border-2 border-[#8D6E63] text-[#5D4037] font-medium">
        Active
      </div>


      {/* Enroll button for students */}
      {!isTutor && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onEnroll(course.courseId)}
          disabled={enrolling}
          className="w-full py-2 bg-[#5D4037] text-[#F5F5DC] rounded-lg hover:bg-[#6D4C41] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {enrolling ? "Enrolling..." : "Enroll in Course"}
        </motion.button>
      )}
    </motion.div>
  );
}

export default function Courses() {
  const { address } = useAccount();
  const { data: userData } = useUsers(address);
  const { courseCount, isLoading, error } = useGetAllCourses();
  const { data: tutorCourses } = useGetTutorCourses(address);
  const { enrollInCourse, isPending: enrolling } = useEnrollInCourse();
  const {
    createCourse,
    isPending: creatingCourse,
    isConfirming: confirmingCourse,
    isConfirmed: courseCreated,
    error: createError
  } = useCreateCourse();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");

  const isTutor = userData?.role === UserRole.TUTOR;

  // For tutors, use their specific courses. For students, show all available courses
  const courseIds = isTutor && tutorCourses
    ? tutorCourses.map((course: Course) => course.courseId)
    : Array.from({ length: courseCount }, (_, i) => BigInt(i));

  // Close modal when course is successfully created
  useEffect(() => {
    if (courseCreated) {
      setCreateModalVisible(false);
      setNewCourseTitle("");
      toast.success("Course created successfully!");
    }
  }, [courseCreated]);

  // Handle create errors
  useEffect(() => {
    if (createError) {
      toast.error(`Failed to create course: ${createError.message}`);
    }
  }, [createError]);

  const handleEnroll = (courseId: bigint) => {
    enrollInCourse(courseId);
    toast.success("Enrolling in course...");
  };

  const handleCreateCourse = () => {
    if (!newCourseTitle.trim()) {
      toast.error("Please enter a course title");
      return;
    }
    createCourse(newCourseTitle);
    toast.success("Creating course...");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#5D4037] flex items-center justify-center">
        <div className="text-[#F5F5DC] text-xl">Loading courses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#5D4037] flex items-center justify-center">
        <div className="text-red-300 text-xl">Error loading courses</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#5D4037] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#F5F5DC]">
              Welcome back, {userData?.name}!
            </h1>
            <p className="text-[#D7CCC8] mt-2">
              {isTutor ? "Tutor Dashboard" : "Student Dashboard"}
            </p>
          </div>
          {isTutor && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCreateModalVisible(true)}
              className="px-6 py-3 bg-[#8D6E63] cursor-pointer text-[#F5F5DC] rounded-lg hover:bg-[#A1887F] transition-colors"
            >
              Create New Course
            </motion.button>
          )}
        </div>

        {/* Courses Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#F5F5DC] flex items-center gap-2 mb-6">
            {isTutor ? "My Courses" : "Available Courses"}
            <span className="text-[14px] font-normal text-[#D7CCC8]">
              ({courseIds?.length || 0})
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courseIds.map((courseId, index) => (
              <CourseCard
                key={courseId.toString()}
                courseId={courseId}
                index={index}
                isTutor={isTutor}
                enrolling={enrolling}
                onEnroll={handleEnroll}
                userAddress={address}
              />
            ))}
          </div>

          {courseIds.length === 0 && (
            <div className="text-center py-16 bg-[#F5F5DC] rounded-xl border-2 border-[#8D6E63]">
              <p className="text-[#5D4037] text-xl mb-4">
                {isTutor ? "No courses created yet" : "No courses available"}
              </p>
              {isTutor && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCreateModalVisible(true)}
                  className="px-6 py-3 cursor-pointer bg-[#5D4037] text-[#F5F5DC] rounded-lg hover:bg-[#6D4C41] transition-colors"
                >
                  Create Your First Course
                </motion.button>
              )}
            </div>
          )}
        </div>



        {/* Custom Create Course Modal */}
        <AnimatePresence>
          {createModalVisible && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 bg-opacity-30 z-50 flex items-center justify-center p-4"
                onClick={() => !creatingCourse && !confirmingCourse && setCreateModalVisible(false)}
              >
                {/* Modal */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="bg-[#F5F5DC] rounded-xl w-full max-w-md border-2 border-[#8D6E63] shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="flex justify-between items-center mb-6 p-4 border-b-2 border-[#D7CCC8]">
                    <h2 className="text-2xl font-bold  text-[#5D4037]">
                      Create New Course
                    </h2>
                    <button
                      onClick={() => !creatingCourse && !confirmingCourse && setCreateModalVisible(false)}
                      disabled={creatingCourse || confirmingCourse}
                      className="text-[#5D4037] hover:text-[#6D4C41]  transition-colors text-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ×
                    </button>
                  </div>

                  {/* Form */}
                  <div className="space-y-6 p-4">
                    <div>
                      <label className="block text-sm font-medium mb-3 text-[#5D4037]">
                        Course Title
                      </label>
                      <input
                        type="text"
                        value={newCourseTitle}
                        onChange={(e) => setNewCourseTitle(e.target.value)}
                        placeholder="Enter course title"
                        disabled={creatingCourse || confirmingCourse}
                        className="w-full p-4 border-2 border-[#D7CCC8] rounded-xl focus:border-[#5D4037] focus:ring-2 focus:ring-[#5D4037] focus:ring-opacity-20 transition-colors bg-white text-[#5D4037] placeholder-[#A1887F] text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        autoFocus
                      />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                      <motion.button
                        whileHover={{ scale: creatingCourse || confirmingCourse ? 1 : 1.02 }}
                        whileTap={{ scale: creatingCourse || confirmingCourse ? 1 : 0.98 }}
                        onClick={handleCreateCourse}
                        disabled={creatingCourse || confirmingCourse || !newCourseTitle.trim()}
                        className="flex-1 py-3 bg-[#5D4037] cursor-pointer text-[#F5F5DC] rounded-xl hover:bg-[#6D4C41] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
                      >
                        {creatingCourse && "Confirming in Wallet..."}
                        {confirmingCourse && "Creating Course..."}
                        {!creatingCourse && !confirmingCourse && "Create Course"}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: creatingCourse || confirmingCourse ? 1 : 1.02 }}
                        whileTap={{ scale: creatingCourse || confirmingCourse ? 1 : 0.98 }}
                        onClick={() => setCreateModalVisible(false)}
                        disabled={creatingCourse || confirmingCourse}
                        className="flex-1 py-3 border-2 border-[#8D6E63] cursor-pointer text-[#5D4037] rounded-xl hover:border-[#5D4037] hover:bg-[#F5F5DC]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
                      >
                        Cancel
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}