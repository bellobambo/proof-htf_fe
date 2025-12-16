// components/CoursesDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";
import { Drawer } from "antd";
import {
  useGetAllCourses,
  useGetTutorCourses,
  useEnrollInCourse,
  useUsers,
  UserRole,
  Course,
  useCreateCourse,
  useGetCourse,
  useCreateExam,
  useCourseEnrollments
} from "@/utils/useContractHooks";
import ExamTemplate from "./ExamTemplate";
import { PlusCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import SmartAccountControl from "./SmartAccountControl";

import { useSmartAccount } from "@/utils/useSmartAccount";
// Separate component for individual course to properly use hooks
function CourseCard({
  courseId,
  index,
  isTutor,
  enrolling,
  onEnroll,
  onCreateExam,
  userAddress
}: {
  courseId: bigint;
  index: number;
  isTutor: boolean;
  enrolling: boolean;
  onEnroll: (courseId: bigint) => void;
  onCreateExam: (course: Course) => void;
  userAddress: `0x${string}` | undefined;
}) {
  const { data: course, isLoading } = useGetCourse(courseId);
  const { data: isEnrolled } = useCourseEnrollments(courseId, userAddress);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-[#F5F5DC] p-6 rounded-xl border-2 border-[#8B4513]"
      >
        <div className="text-[#8B4513]">Loading course...</div>
      </motion.div>
    );
  }

  if (!course || !course.isActive) {
    return null;
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Address copied to clipboard!');
    }).catch((err) => {
      toast.error('Failed to copy address');
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-[#F5F5DC] p-6 rounded-xl border-2 border-[#8B4513] hover:border-[#A0522D] transition-colors shadow-sm"
    >
      <h3 className="text-xl font-semibold text-[#8B4513] mb-2">
        {course.title}
      </h3>
      <p className="text-[#A0522D] mb-2">Tutor: {course.tutorName}</p>
      <p
        className="text-[#CD853F] text-sm mb-3 font-mono cursor-pointer hover:text-[#A0522D] transition-colors"
        onClick={() => copyToClipboard(course.tutor)}
        title="Click to copy tutor address"
      >
        {`${course.tutor.slice(0, 6)}...${course.tutor.slice(-4)}`}
      </p>

      <div className="flex items-center gap-2 mb-4">
        <div className="inline-block px-3 py-1 rounded-full text-sm bg-[#FAF0E6] border border-[#8B4513] text-[#8B4513] font-medium">
          Active
        </div>

        {/* Enrollment status badge for students */}
        {!isTutor && isEnrolled && (
          <div className="inline-block px-3 py-1 rounded-full text-sm bg-green-100 border border-green-600 text-green-700 font-medium">
            Enrolled
          </div>
        )}
      </div>

      <div className="space-y-2">
        {/* Create Exam button for tutors */}
        {isTutor && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onCreateExam(course)}
            className="w-full py-2 cursor-pointer bg-[#8B4513] text-[#F5F5DC] rounded-lg hover:bg-[#A0522D] transition-colors font-medium"
          >
            Create Exam
          </motion.button>
        )}

        {/* Enroll button for students */}
        {!isTutor && (
          <motion.button
            whileHover={!isEnrolled ? { scale: 1.02 } : {}}
            whileTap={!isEnrolled ? { scale: 0.98 } : {}}
            onClick={() => onEnroll(course.courseId)}
            disabled={enrolling || isEnrolled}
            className={`w-full py-2 cursor-pointer text-[#F5F5DC] rounded-lg transition-colors font-medium ${isEnrolled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#654321] hover:bg-[#8B4513] disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
          >
            {enrolling ? "Enrolling..." : isEnrolled ? "Already Enrolled" : "Enroll in Course"}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

export default function Courses() {
  const { address } = useAccount(); // EOA Address
  
  // 2. GET SMART ACCOUNT ADDRESS
  const { smartAccountAddress } = useSmartAccount();

  // 3. DETERMINE ACTIVE ADDRESS
  // If Smart Account exists, use it. Otherwise fallback to MetaMask EOA.
  // This ensures we fetch data for the actual creator of the courses.
  const activeAddress = smartAccountAddress || address;

  // 4. USE ACTIVE ADDRESS IN HOOKS
  const { data: userData } = useUsers(activeAddress);
  const { courseCount, isLoading, error } = useGetAllCourses();
  
  // Fetch courses owned by the Smart Account
  const { data: tutorCourses } = useGetTutorCourses(activeAddress);
  
  const { enrollInCourse, isPending: enrolling } = useEnrollInCourse();
  
  const {
    createCourse,
    isPending: creatingCourse,
    isConfirming: confirmingCourse,
    isConfirmed: courseCreated,
    error: createError
  } = useCreateCourse();
  
  const {
    createExam,
    isPending: creatingExam,
    isConfirming: confirmingExam,
    isConfirmed: examCreated
  } = useCreateExam();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [createExamDrawerVisible, setCreateExamDrawerVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Exam creation state
  const [newExamTitle, setNewExamTitle] = useState("");
  const [questions, setQuestions] = useState<{
    text: string;
    options: [string, string, string, string];
    correctAnswer: number;
  }[]>([]);

  const isTutor = userData?.role === UserRole.TUTOR;

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

  // Close drawer when exam is successfully created
  useEffect(() => {
    if (examCreated) {
      setCreateExamDrawerVisible(false);
      setSelectedCourse(null);
      resetExamForm();
      toast.success("Exam created successfully!");
    }
  }, [examCreated]);

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

  const handleOpenCreateExam = (course: Course) => {
    setSelectedCourse(course);
    setCreateExamDrawerVisible(true);
  };

  const resetExamForm = () => {
    setNewExamTitle("");
    setQuestions([]);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: "",
        options: ["", "", "", ""],
        correctAnswer: 0
      }
    ]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    if (field === "text") {
      newQuestions[index].text = value;
    } else if (field.startsWith("option")) {
      const optionIndex = parseInt(field.replace("option", ""));
      newQuestions[index].options[optionIndex] = value;
    } else if (field === "correctAnswer") {
      newQuestions[index].correctAnswer = value;
    }
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleCreateExam = () => {
    if (!newExamTitle.trim() || !selectedCourse || questions.length === 0) {
      toast.error("Please fill all fields and add at least one question");
      return;
    }

    const invalidQuestion = questions.find(
      q => !q.text.trim() || q.options.some(opt => !opt.trim())
    );

    if (invalidQuestion) {
      toast.error("Please complete all question fields");
      return;
    }

    const questionTexts = questions.map(q => q.text);
    const questionOptions = questions.map(q => q.options);
    const correctAnswers = questions.map(q => BigInt(q.correctAnswer));

    createExam(selectedCourse.courseId, newExamTitle, questionTexts, questionOptions, correctAnswers);
    toast.success("Creating exam...");
  };

  const handleTemplateImport = (file: File, examTitle: string, importedQuestions: any[]) => {
    try {
      if (examTitle) {
        setNewExamTitle(examTitle);
      }

      if (importedQuestions.length > 0) {
        setQuestions(importedQuestions);
      }
    } catch (error) {
      console.error('Error processing template:', error);
      toast.error("Error processing template file. Please make sure it follows the correct format.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#8B4513] flex items-center justify-center">
        <div className="text-[#F5F5DC] text-xl">Loading courses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#8B4513] flex items-center justify-center">
        <div className="text-red-300 text-xl">Error loading courses</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#8B4513] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#F5F5DC]">
              Welcome back, {userData?.name || "User"}!
            </h1>
            <p className="text-[#F5F5DC] mt-2">
              {isTutor ? "Tutor Dashboard" : "Student Dashboard"}
            </p>
            {/* Debug Info (Optional - remove before production) */}
             <div className="text-xs text-[#D2B48C] mt-1">
              {smartAccountAddress ? "Using Smart Account" : "Using Wallet"}
            </div>
          </div>

          {/* <SmartAccountControl/> */}
          {isTutor && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCreateModalVisible(true)}
              className="px-6 py-3 bg-[#A0522D] border border-[#D2B48C] cursor-pointer text-[#F5F5DC] rounded-lg hover:bg-[#8B4513] transition-colors font-medium"
            >
              Create New Course
            </motion.button>
          )}
        </div>

        {/* Courses Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#F5F5DC] flex items-center gap-2 mb-6 justify-between">
            <div className="flex items-center gap-2">
              {isTutor ? "My Courses" : "Available Courses"}
              <span className="text-[14px] font-normal text-[#F5F5DC]">
                ({courseIds?.length || 0})
              </span>
            </div>

            <a
              href="/exams"
              className="text-[16px] text-[#F5F5DC] underline hover:text-[#FFF8DC] transition"
            >
              Go to Exams
            </a>
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
                onCreateExam={handleOpenCreateExam}
                // 5. Pass the Active Address to the card too
                userAddress={activeAddress}
              />
            ))}
          </div>

          {courseIds.length === 0 && (
            <div className="text-center py-16">
              <p className="text-[#F5F5DC] text-xl mb-4">
                {isTutor ? "No courses created yet" : "No courses available"}
              </p>
            </div>
          )}
        </div>

        {/* ... (Keep your Modals and Drawers exactly as they were) ... */}
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
                  className="bg-[#F5F5DC] rounded-xl w-full max-w-md border-2 border-[#8B4513] shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="flex justify-between items-center mb-6 p-4 border-b-2 border-[#D2B48C]">
                    <h2 className="text-2xl font-bold text-[#8B4513]">
                      Create New Course
                    </h2>
                    <button
                      onClick={() => !creatingCourse && !confirmingCourse && setCreateModalVisible(false)}
                      disabled={creatingCourse || confirmingCourse}
                      className="text-[#8B4513] hover:text-[#654321] transition-colors text-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ×
                    </button>
                  </div>

                  {/* Form */}
                  <div className="space-y-6 p-4">
                    <div>
                      <label className="block text-[16px] font-medium mb-3 text-[#8B4513]">
                        Course Title
                      </label>
                      <input
                        type="text"
                        value={newCourseTitle}
                        onChange={(e) => setNewCourseTitle(e.target.value)}
                        placeholder="Enter course title"
                        disabled={creatingCourse || confirmingCourse}
                        className="w-full p-4 border-2 border-[#D2B48C] rounded-xl focus:border-[#8B4513] focus:ring-2 focus:ring-[#8B4513] focus:ring-opacity-20 transition-colors bg-white text-[#8B4513] placeholder-[#A0522D] text-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
                        className="flex-1 py-3 bg-[#8B4513] cursor-pointer text-[#F5F5DC] rounded-xl hover:bg-[#654321] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
                      >
                        {/* {creatingCourse && "Confirming in Wallet..."} */}
                        {creatingCourse && null}
                        {confirmingCourse && "Creating Course..."}
                        {!creatingCourse && !confirmingCourse && "Create Course"}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: creatingCourse || confirmingCourse ? 1 : 1.02 }}
                        whileTap={{ scale: creatingCourse || confirmingCourse ? 1 : 0.98 }}
                        onClick={() => setCreateModalVisible(false)}
                        disabled={creatingCourse || confirmingCourse}
                        className="flex-1 py-3 border-2 border-[#8B4513] cursor-pointer text-[#8B4513] rounded-xl hover:border-[#654321] hover:bg-[#F5F5DC]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
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

        {/* Create Exam Drawer */}
        <Drawer
          title={
            <div className="flex items-center gap-2">
              <span className="text-[#8B4513] text-xl font-semibold">
                Create Exam for: {selectedCourse?.title}
              </span>
            </div>
          }
          placement="right"
          onClose={() => {
            if (!creatingExam && !confirmingExam) {
              setCreateExamDrawerVisible(false);
              setSelectedCourse(null);
              resetExamForm();
            }
          }}
          open={createExamDrawerVisible}
          width={800}
          maskClosable={!creatingExam && !confirmingExam}
          closeIcon={<div className="text-[#8B4513] hover:text-[#654321] transition-colors">✕</div>}
          styles={{
            body: { backgroundColor: '#F5F5DC', padding: '20px' },
            header: { backgroundColor: '#F5F5DC', borderBottom: '2px solid #D2B48C' },
            content: { backgroundColor: '#F5F5DC' }
          }}
        >
          <div className="space-y-2">
            {/* Template Section */}


            <div className="flex justify-between items-center mb-2">
              <label className="block text-[20px] font-medium text-[#8B4513]">
                Exam Title
              </label>

              <div className="ml-4">
                <ExamTemplate
                  onImport={(file, examTitle, questions) => handleTemplateImport(file, examTitle, questions)}
                  disabled={creatingExam || confirmingExam}
                />
              </div>
            </div>

            <input
              type="text"
              value={newExamTitle}
              onChange={(e) => setNewExamTitle(e.target.value)}
              placeholder="Enter exam title"
              disabled={creatingExam || confirmingExam}
              className="w-full p-3 border-2 border-[#D2B48C] text-[#8B4513] rounded-lg focus:border-[#8B4513] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed bg-white"
            />


            <div className="border-t-2 border-[#D2B48C] pt-8">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="font-semibold text-[#8B4513] text-[16px]">Questions</h4>
                  <p className="text-sm text-[#A0522D]">
                    {questions.length} question(s) added
                  </p>
                </div>

                <div className="flex items-center gap-3">

                  <button
                    onClick={addQuestion}
                    disabled={creatingExam || confirmingExam}
                    className="px-4 py-2 cursor-pointer border-2 border-[#8B4513] text-[#8B4513] rounded-lg hover:bg-[#8B4513] hover:text-[#F5F5DC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-nowrap h-[42px] flex items-center gap-2"
                  >
                    <PlusCircleOutlined className="text-[16px]" />
                    Add Question
                  </button>
                </div>

              </div>

              <div className="max-h-[calc(100vh-400px)] overflow-y-auto pr-2 space-y-4">
                {questions.map((question, index) => (
                  <div key={index} className="border-2 border-[#D2B48C] p-4 rounded-lg bg-white shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium text-[#8B4513]">Question {index + 1}</span>
                      <button
                        onClick={() => removeQuestion(index)}
                        disabled={creatingExam || confirmingExam}
                        className="text-red-600 cursor-pointer hover:text-red-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-1"
                      >
                        <DeleteOutlined className="text-[18px]" />

                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Enter question text"
                      value={question.text}
                      onChange={(e) => updateQuestion(index, "text", e.target.value)}
                      disabled={creatingExam || confirmingExam}
                      className="w-full p-3 border-2 text-[#8B4513] border-[#D2B48C] rounded-lg mb-3 focus:border-[#8B4513] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />

                    <div className="space-y-2 mb-3">
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#8B4513] min-w-20">
                            {String.fromCharCode(97 + optIndex)})
                          </span>
                          <input
                            type="text"
                            placeholder={`Enter option ${String.fromCharCode(97 + optIndex)}`}
                            value={option}
                            onChange={(e) => updateQuestion(index, `option${optIndex}`, e.target.value)}
                            disabled={creatingExam || confirmingExam}
                            className="flex-1 p-2 border-2 text-[#8B4513] border-[#D2B48C] rounded-md focus:border-[#8B4513] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      ))}
                    </div>

                    <select
                      value={question.correctAnswer}
                      onChange={(e) => updateQuestion(index, "correctAnswer", parseInt(e.target.value))}
                      disabled={creatingExam || confirmingExam}
                      className="w-full p-2 border-2 text-[#8B4513] border-[#D2B48C] rounded-lg focus:border-[#8B4513] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                    >
                      <option value={0}>Correct Answer: a</option>
                      <option value={1}>Correct Answer: b</option>
                      <option value={2}>Correct Answer: c</option>
                      <option value={3}>Correct Answer: d</option>
                    </select>
                  </div>
                ))}
              </div>

              {questions.length === 0 && (
                <div className="text-center py-8 text-[#A0522D] bg-[#FAF0E6] rounded-lg border-2 border-dashed border-[#8B4513]">
                  <p className="mb-2">No questions added yet.</p>
                  <p className="text-sm">Click "Add Question" to start or upload a question file.</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t-2 border-[#D2B48C]">
              <button
                onClick={handleCreateExam}
                disabled={!newExamTitle.trim() || questions.length === 0 || creatingExam || confirmingExam}
                className="flex-1 py-3 bg-[#8B4513] cursor-pointer text-[#F5F5DC] rounded-lg hover:bg-[#654321] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {creatingExam && "Confirming in Wallet..."}
                {confirmingExam && "Creating Exam..."}
                {!creatingExam && !confirmingExam && "Create Exam"}
              </button>
              <button
                onClick={() => {
                  setCreateExamDrawerVisible(false);
                  setSelectedCourse(null);
                  resetExamForm();
                }}
                disabled={creatingExam || confirmingExam}
                className="flex-1 py-3 border-2 border-[#8B4513] cursor-pointer text-[#8B4513] rounded-lg hover:border-[#654321] hover:bg-[#F5F5DC]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </Drawer>
      </div>
    </div>
  );
} 