"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Drawer, Button, Radio, Space } from "antd";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";
import {
  useGetAvailableExamsForStudent,
  useGetTutorCourses,
  useUsers,
  useTakeExam,
  useGetExamQuestions,
  UserRole,
  ExamQuestion,
  useCreateExam,
  useGetExam,
  useExamSessions,
  Exam,
  Course,
  useGetCourse // Add this import
} from "@/utils/useContractHooks";

// Individual exam card component for students
function StudentExamCard({
  examId,
  index,
  enrolledCourseIds,
  studentAddress,
  onClick
}: {
  examId: bigint;
  index: number;
  enrolledCourseIds: Set<bigint>;
  studentAddress: `0x${string}` | undefined;
  onClick: (exam: Exam, isCompleted: boolean, score: bigint) => void;
}) {
  const { data: exam, isLoading } = useGetExam(examId);
  const { data: sessionData } = useExamSessions(examId, studentAddress);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-[#F5F5DC] p-6 rounded-xl border-2 border-[#8D6E63]"
      >
        <div className="text-[#8B4513]">Loading exam...</div>
      </motion.div>
    );
  }

  if (!exam || !exam.isActive) {
    return null;
  }

  // Check if exam belongs to an enrolled course
  const isEnrolled = enrolledCourseIds.has(exam.courseId);
  if (!isEnrolled) {
    return null;
  }

  // Convert session data to ExamSession object
  const isCompleted = sessionData ? sessionData[3] : false;
  const score = sessionData ? sessionData[2] : BigInt(0);

  // Don't show completed exams
  if (isCompleted) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-[#F5F5DC] p-6 rounded-xl border-2 border-[#8D6E63] hover:border-[#5D4037] transition-colors cursor-pointer"
      onClick={() => onClick(exam, isCompleted, score)}
    >
      <h3 className="text-xl font-semibold text-[#5D4037] mb-2">
        {exam.title}
      </h3>
      <p className="text-[#6D4C41] mb-2">
        Questions: {exam.questionCount.toString()}
      </p>
      <p className="text-[#8D6E63] text-sm mb-3">
        Course ID: {exam.courseId.toString()}
      </p>
      <div className="inline-block px-3 py-1 rounded-full text-sm bg-[#F5F5DC] border-2 border-[#8D6E63] text-[#5D4037] font-medium">
        Active
      </div>
    </motion.div>
  );
}

// Individual exam card component for tutors
function TutorExamCard({
  examId,
  index,
  tutorAddress
}: {
  examId: bigint;
  index: number;
  tutorAddress: `0x${string}` | undefined;
}) {
  const { data: exam, isLoading } = useGetExam(examId);
  const { data: course } = useGetCourse(exam?.courseId); // Use the imported hook

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-[#F5F5DC] p-6 rounded-xl border-2 border-[#8D6E63]"
      >
        <div className="text-[#5D4037]">Loading exam...</div>
      </motion.div>
    );
  }

  if (!exam || !exam.isActive || exam.creator !== tutorAddress) {
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
        {exam.title}
      </h3>
      <p className="text-[#6D4C41] mb-2">
        Questions: {exam.questionCount.toString()}
      </p>
      <p className="text-[#8D6E63] text-[16px] mb-1">
        Course: {course?.title || `Course ID: ${exam.courseId.toString()}`}
      </p>
      <p className="text-[#8D6E63] text-[16px] mb-1">
        Tutor: {course?.tutorName || "Unknown Tutor"}
      </p>
      <p className="text-[#8D6E63] text-[16px] mb-3">
        Wallet: {exam.creator.slice(0, 6)}...{exam.creator.slice(-4)}
      </p>
      <div className="inline-block px-3 py-1 rounded-full text-[16px] bg-[#F5F5DC] border-2 border-[#8D6E63] text-[#5D4037] font-medium">
        Created by You
      </div>
    </motion.div>
  );
}

// Remove the custom useGetCourse hook since you're importing it from useContractHooks
// The useGetCourse hook is already defined in your hooks file

export default function ExamsPage() {
  const { address } = useAccount();
  const { data: userData } = useUsers(address);
  const { examIds, enrolledCourses, isLoading } = useGetAvailableExamsForStudent(address);
  const { data: tutorCourses } = useGetTutorCourses(address);
  const { takeExam, isPending: submittingExam } = useTakeExam();

  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [takeExamDrawerVisible, setTakeExamDrawerVisible] = useState(false);

  const isTutor = userData?.role === UserRole.TUTOR;

  // Create set of enrolled course IDs for quick lookup
  const enrolledCourseIds = new Set(
    enrolledCourses?.map(course => course.courseId) || []
  );

  const { data: questionsData } = useGetExamQuestions(
    selectedExam?.examId
  );

  useEffect(() => {
    if (questionsData && selectedExam) {
      // Transform questions data to ExamQuestion format
      // Note: correctAnswer is set to 0 as a placeholder since students shouldn't see correct answers
      const transformedQuestions: ExamQuestion[] = questionsData[0].map((text, index) => ({
        questionText: text,
        options: [...questionsData[1][index]] as [string, string, string, string],
        correctAnswer: 0 // Placeholder - students don't see correct answers before taking exam
      }));
      setExamQuestions(transformedQuestions);
      setAnswers(new Array(transformedQuestions.length).fill(-1));
    }
  }, [questionsData, selectedExam]);

  const handleExamClick = (exam: Exam, isCompleted: boolean, score: bigint) => {
    setSelectedExam(exam);
    setDrawerVisible(true);
  };

  const handleTakeExam = () => {
    setDrawerVisible(false);
    setTakeExamDrawerVisible(true);
  };

  const handleAnswerChange = (questionIndex: number, answer: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answer;
    setAnswers(newAnswers);
  };

  const handleSubmitExam = () => {
    if (answers.some(answer => answer === -1)) {
      toast.error("Please answer all questions");
      return;
    }

    if (selectedExam) {
      takeExam(selectedExam.examId, answers.map(answer => BigInt(answer)));
      toast.success("Submitting exam...");
      setTakeExamDrawerVisible(false);
      setSelectedExam(null);
      setAnswers([]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#8B4513] flex items-center justify-center">
        <div className="text-[#F5F5DC] text-xl">Loading exams...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#8B4513] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex flex-col gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.history.back()}
              className=" cursor-pointer py-2 text-[#F5F5DC] rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Courses
            </motion.button>
            <h1 className="text-3xl font-bold text-[#F5F5DC]">
              {isTutor ? "My Created Exams" : "Available Exams"}
            </h1>
          </div>
        </div>

        {/* Exams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!isTutor && examIds.map((examId, index) => (
            <StudentExamCard
              key={examId.toString()}
              examId={examId}
              index={index}
              enrolledCourseIds={enrolledCourseIds}
              studentAddress={address}
              onClick={handleExamClick}
            />
          ))}

          {isTutor && examIds.map((examId, index) => (
            <TutorExamCard
              key={examId.toString()}
              examId={examId}
              index={index}
              tutorAddress={address}
            />
          ))}
        </div>

        {/* Empty States */}
        {!isTutor && examIds.length === 0 && (
          <div className="text-center py-16 bg-[#F5F5DC] rounded-xl border-2 border-[#8D6E63]">
            <p className="text-[#5D4037] text-xl">No exams available</p>
            <p className="text-[#6D4C41] mt-2">Enroll in courses to see available exams</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.history.back()}
              className="mt-4 px-6 py-2 bg-[#8B4513] text-[#F5F5DC] rounded-lg hover:bg-[#6D4C41] transition-colors"
            >
              Back to Courses
            </motion.button>
          </div>
        )}

        {isTutor && examIds.length === 0 && (
          <div className="text-center py-16 bg-[#F5F5DC] rounded-xl border-2 border-[#8D6E63]">
            <p className="text-[#5D4037] text-xl">No exams created yet</p>
            <p className="text-[#6D4C41] mt-2">Create exams from your course management page</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.history.back()}
              className="mt-4 px-6 py-2 bg-[#8B4513] text-[#F5F5DC] rounded-lg hover:bg-[#6D4C41] transition-colors"
            >
              Back to Courses
            </motion.button>
          </div>
        )}

        {/* Exam Detail Drawer */}
        <Drawer
          title={<span className="text-[#5D4037]">Exam Details</span>}
          placement="right"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width={400}
        >
          {selectedExam && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg text-[#5D4037]">{selectedExam.title}</h3>
                <p className="text-[#6D4C41]">
                  Questions: {selectedExam.questionCount.toString()}
                </p>
                <p className="text-[#8D6E63] text-[20px]">
                  Exam ID: {selectedExam.examId.toString()}
                </p>
                <p className="text-[#8D6E63] text-[20px]">
                  Course ID: {selectedExam.courseId.toString()}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="primary"
                  onClick={handleTakeExam}
                  className="w-full bg-[#8B4513] hover:bg-[#6D4C41]"
                >
                  Take Exam
                </Button>
                <Button
                  onClick={() => setDrawerVisible(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </Drawer>

        {/* Take Exam Drawer */}
        <Drawer
          title={<span className="text-[#5D4037]">Taking Exam: {selectedExam?.title}</span>}
          placement="right"
          onClose={() => setTakeExamDrawerVisible(false)}
          open={takeExamDrawerVisible}
          width={600}
          maskClosable={false}
        >
          <div className="space-y-6">
            {examQuestions.map((question, index) => (
              <div key={index} className="border-b border-[#D7CCC8] pb-4">
                <h4 className="font-semibold mb-3 text-[#5D4037]">
                  Question {index + 1}: {question.questionText}
                </h4>
                <Radio.Group
                  value={answers[index]}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                >
                  <Space direction="vertical">
                    {question.options.map((option, optIndex) => (
                      <Radio key={optIndex} value={optIndex}>
                        {option}
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              </div>
            ))}

            <div className="flex gap-2">
              <Button
                type="primary"
                loading={submittingExam}
                onClick={handleSubmitExam}
                className="w-full bg-[#8B4513] hover:bg-[#6D4C41]"
                disabled={answers.some(answer => answer === -1)}
              >
                Submit Exam
              </Button>
              <Button
                onClick={() => setTakeExamDrawerVisible(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Drawer>
      </div>
    </div>
  );
}