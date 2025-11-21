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
  useCreateExam
} from "@/utils/useContractHooks";
import ExamTemplate from "./ExamTemplate";

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
      <p className="text-[#CD853F] text-sm mb-3 font-mono">
        {`${course.tutor.slice(0, 6)}...${course.tutor.slice(-4)}`}
      </p>

      <div className="inline-block px-3 py-1 rounded-full text-sm mb-4 bg-[#FAF0E6] border border-[#8B4513] text-[#8B4513] font-medium">
        Active
      </div>

      {/* Buttons container */}
      <div className="space-y-2">
        {/* Create Exam button for tutors */}
        {isTutor && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onCreateExam(course)}
            className="w-full py-2 bg-[#8B4513] text-[#F5F5DC] rounded-lg hover:bg-[#A0522D] transition-colors font-medium"
          >
            Create Exam
          </motion.button>
        )}

        {/* Enroll button for students */}
        {!isTutor && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onEnroll(course.courseId)}
            disabled={enrolling}
            className="w-full py-2 bg-[#654321] text-[#F5F5DC] rounded-lg hover:bg-[#8B4513] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {enrolling ? "Enrolling..." : "Enroll in Course"}
          </motion.button>
        )}
      </div>
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

    // Validate all questions are complete
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

  // Function to handle template import
  const handleTemplateImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n').map(line => line.trim()).filter(line => line);

        let examTitle = "";
        const importedQuestions: { text: string; options: [string, string, string, string]; correctAnswer: number }[] = [];

        let currentQuestion: any = null;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Extract exam title
          if (line.startsWith('EXAM TITLE:')) {
            examTitle = line.replace('EXAM TITLE:', '').trim().replace(/^\[.*\]$/, '').trim();
            continue;
          }

          // Skip instructions and example sections
          if (line === 'INSTRUCTIONS:' || line === 'EXAMPLE:' || line === 'EXAM TEMPLATE' || line.includes('===')) {
            continue;
          }

          // Detect question number (e.g., "1.", "2.")
          const questionMatch = line.match(/^(\d+)\.\s*(.+[?])$/);
          if (questionMatch) {
            // Save previous question if exists
            if (currentQuestion && currentQuestion.text && currentQuestion.options.every((opt: string) => opt.trim())) {
              importedQuestions.push(currentQuestion);
            }

            currentQuestion = {
              text: questionMatch[2].trim(),
              options: ['', '', '', ''],
              correctAnswer: 0
            };
            continue;
          }

          // Detect options (a), b), c), d)
          const optionMatch = line.match(/^([a-d])\)\s*(.+)$/);
          if (optionMatch && currentQuestion) {
            const optLetter = optionMatch[1];
            const optText = optionMatch[2].trim();
            const optIndex = ['a', 'b', 'c', 'd'].indexOf(optLetter);

            if (optIndex >= 0 && optIndex < 4) {
              currentQuestion.options[optIndex] = optText;
            }
            continue;
          }

          // Detect correct answer (a, b, c, d)
          const answerMatch = line.match(/Correct Answer:\s*([a-d])/i);
          if (answerMatch && currentQuestion) {
            const answerLetter = answerMatch[1].toLowerCase();
            currentQuestion.correctAnswer = ['a', 'b', 'c', 'd'].indexOf(answerLetter);
            continue;
          }

          // If we're in a question block and line doesn't match patterns, it might be continuation of question text
          if (currentQuestion && !line.match(/^[a-d]\)/) && !line.match(/Correct Answer:/i) &&
            !line.match(/^\d+\./) && line !== '' && !currentQuestion.text.endsWith('?')) {
            currentQuestion.text += ' ' + line;
          }
        }

        // Add the last question
        if (currentQuestion && currentQuestion.text && currentQuestion.options.every((opt: string) => opt.trim())) {
          importedQuestions.push(currentQuestion);
        }

        if (examTitle) {
          setNewExamTitle(examTitle);
        }

        if (importedQuestions.length > 0) {
          setQuestions(importedQuestions);
        }
      } catch (error) {
        console.error('Error parsing template:', error);
        toast.error("Error parsing template file. Please make sure it follows the correct format.");
      }
    };
    reader.readAsText(file);
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
              Welcome back, {userData?.name}!
            </h1>
            <p className="text-[#F5F5DC] mt-2">
              {isTutor ? "Tutor Dashboard" : "Student Dashboard"}
            </p>
          </div>
          {isTutor && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCreateModalVisible(true)}
              className="px-6 py-3 bg-[#A0522D] cursor-pointer text-[#F5F5DC] rounded-lg hover:bg-[#8B4513] transition-colors font-medium"
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
              href="/exam"
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
                userAddress={address}
              />
            ))}
          </div>

          {courseIds.length === 0 && (
            <div className="text-center py-16 bg-[#F5F5DC] rounded-xl border-2 border-[#8B4513]">
              <p className="text-[#8B4513] text-xl mb-4">
                {isTutor ? "No courses created yet" : "No courses available"}
              </p>
              {isTutor && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCreateModalVisible(true)}
                  className="px-6 py-3 cursor-pointer bg-[#654321] text-[#F5F5DC] rounded-lg hover:bg-[#8B4513] transition-colors font-medium"
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
                      <label className="block text-sm font-medium mb-3 text-[#8B4513]">
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
                        {creatingCourse && "Confirming in Wallet..."}
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
          <div className="space-y-4">
            {/* Template Section */}
            <ExamTemplate
              onImport={handleTemplateImport}
              disabled={creatingExam || confirmingExam}
            />

            <div>
              <label className="block text-sm font-medium mb-2 text-[#8B4513]">
                Exam Title
              </label>
              <input
                type="text"
                value={newExamTitle}
                onChange={(e) => setNewExamTitle(e.target.value)}
                placeholder="Enter exam title"
                disabled={creatingExam || confirmingExam}
                className="w-full p-3 border-2 border-[#D2B48C] text-[#8B4513] rounded-lg focus:border-[#8B4513] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              />
            </div>

            <div className="border-t-2 border-[#D2B48C] pt-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="font-semibold text-[#8B4513]">Questions</h4>
                  <p className="text-sm text-[#A0522D]">
                    {questions.length} question(s) added
                  </p>
                </div>
                <button
                  onClick={addQuestion}
                  disabled={creatingExam || confirmingExam}
                  className="px-4 py-2 border-2 border-[#8B4513] text-[#8B4513] rounded-lg hover:bg-[#8B4513] hover:text-[#F5F5DC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Question
                </button>
              </div>

              <div className="max-h-[calc(100vh-400px)] overflow-y-auto pr-2 space-y-4">
                {questions.map((question, index) => (
                  <div key={index} className="border-2 border-[#D2B48C] p-4 rounded-lg bg-white shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium text-[#8B4513]">Question {index + 1}</span>
                      <button
                        onClick={() => removeQuestion(index)}
                        disabled={creatingExam || confirmingExam}
                        className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        Remove
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
                          <span className="text-sm font-medium text-[#8B4513] min-w-[80px]">
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
                  <p className="text-sm">Click "Add Question" to start or upload a template file.</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t-2 border-[#D2B48C]">
              <button
                onClick={handleCreateExam}
                disabled={!newExamTitle.trim() || questions.length === 0 || creatingExam || confirmingExam}
                className="flex-1 py-3 bg-[#8B4513] text-[#F5F5DC] rounded-lg hover:bg-[#654321] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
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
                className="flex-1 py-3 border-2 border-[#8B4513] text-[#8B4513] rounded-lg hover:border-[#654321] hover:bg-[#F5F5DC]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
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