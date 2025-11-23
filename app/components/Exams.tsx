"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Drawer } from "antd";
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
  useGetExam,
  useExamSessions,
  Exam,
  useGetCourse,
  useGetPastExamForRevision
} from "@/utils/useContractHooks";

// Import the new component
import { PastExamQuestions } from "./PastExamQuestions";



// Add this interface definition


function StudentExamCard({
  examId,
  index,
  enrolledCourseIds,
  studentAddress,
  onClick,
  onViewPastQuestions
}: {
  examId: bigint;
  index: number;
  enrolledCourseIds: Set<bigint>;
  studentAddress: `0x${string}` | undefined;
  onClick: (exam: Exam, isCompleted: boolean, score: bigint) => void;
  onViewPastQuestions: (exam: Exam, examId: bigint) => void; // Add examId parameter
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

  const isEnrolled = enrolledCourseIds.has(exam.courseId);
  if (!isEnrolled) {
    return null;
  }

  const isCompleted = sessionData ? sessionData[3] : false;
  const score = sessionData ? sessionData[2] : BigInt(0);

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
      <div className="text-[#8D6E63] text-sm mb-3 space-y-1">
        <p>Course ID: {exam.courseId.toString()}</p>
        <p className="font-mono bg-[#FFF8E1] py-1 rounded">
          Exam ID: {examId.toString()}
        </p>
      </div>
      <div
        className={`inline-block px-3 py-1 rounded-full text-sm border-2 font-medium ${isCompleted
          ? "bg-[#E8F5E8] border-[#4CAF50] text-[#2E7D32]"
          : "bg-[#FFF8E1] border-[#FFA000] text-[#5D4037]"
          }`}
      >
        {isCompleted ? `Completed - Score: ${score.toString()}` : "Available"}
      </div>
      {!isCompleted ? (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full mt-4 py-2 bg-[#8B4513] text-[#F5F5DC] rounded-lg hover:bg-[#6D4C41] transition-colors font-semibold"
          onClick={(e) => {
            e.stopPropagation();
            onClick(exam, isCompleted, score);
          }}
        >
          Take Exam
        </motion.button>
      ) : (
        <div className="mt-4 space-y-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full py-2 bg-[#5D4037] text-[#F5F5DC] rounded-lg hover:bg-[#4E342E] transition-colors font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              onClick(exam, isCompleted, score);
            }}
          >
            View Details
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full py-2 bg-[#8B4513] text-[#F5F5DC] rounded-lg hover:bg-[#6D4C41] transition-colors font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              onViewPastQuestions(exam, examId); // Pass both exam and examId
            }}
          >
            View Past Questions
          </motion.button>
        </div>
      )}
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
  const { data: course } = useGetCourse(exam?.courseId);

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

export default function ExamsPage() {
  const { address } = useAccount();
  const { data: userData } = useUsers(address);
  const { examIds, enrolledCourses, isLoading } =
    useGetAvailableExamsForStudent(address);
  const { data: tutorCourses } = useGetTutorCourses(address);
  const {
    takeExam,
    isPending: submittingExam,
    isConfirmed,
    error
  } = useTakeExam();

  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [takeExamDrawerVisible, setTakeExamDrawerVisible] = useState(false);
  const [resultsDrawerVisible, setResultsDrawerVisible] = useState(false);
  const [examScore, setExamScore] = useState<{
    score: bigint;
    total: bigint;
  } | null>(null);
  const [pastExamData, setPastExamData] = useState<any>(null);
  const [pastExamDrawerVisible, setPastExamDrawerVisible] = useState(false);

  const isTutor = userData?.role === UserRole.TUTOR;

  const enrolledCourseIds = new Set(
    enrolledCourses?.map((course) => course.courseId) || []
  );

  const { data: questionsData } = useGetExamQuestions(selectedExam?.examId);

  const { refetch: refetchPastExam } = useGetPastExamForRevision(selectedExam?.examId);

  useEffect(() => {
    if (questionsData && selectedExam) {
      const transformedQuestions: ExamQuestion[] = questionsData[0].map(
        (text, index) => ({
          questionText: text,
          options: [...questionsData[1][index]] as [
            string,
            string,
            string,
            string
          ],
          correctAnswer: 0
        })
      );
      setExamQuestions(transformedQuestions);
      setAnswers(new Array(transformedQuestions.length).fill(-1));
    }
  }, [questionsData, selectedExam]);

  const handleExamClick = (
    exam: Exam,
    isCompleted: boolean,
    score: bigint
  ) => {
    setSelectedExam(exam);
    if (isCompleted) {
      setExamScore({ score, total: exam.questionCount });
      setResultsDrawerVisible(true);
    } else {
      setTakeExamDrawerVisible(true);
    }
  };

  const handleAnswerChange = (questionIndex: number, answer: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answer;
    setAnswers(newAnswers);
  };

  const handleSubmitExam = () => {
    if (answers.some((answer) => answer === -1)) {
      toast.error("Please answer all questions");
      return;
    }

    if (selectedExam) {
      takeExam(
        selectedExam.examId,
        answers.map((answer) => BigInt(answer))
      );
      toast.success("Submitting exam...");
    }
  };

  useEffect(() => {
    if (isConfirmed && selectedExam) {
      setTakeExamDrawerVisible(false);
      setExamScore({
        score: BigInt(0),
        total: selectedExam.questionCount
      });
      setResultsDrawerVisible(true);
      setSelectedExam(null);
      setAnswers([]);
      toast.success("Exam submitted successfully!");
    }
  }, [isConfirmed, selectedExam]);

  useEffect(() => {
    if (error) {
      toast.error("Failed to submit exam");
      console.error(error);
    }
  }, [error]);

  const handleViewPastQuestions = (exam: Exam, examId: bigint) => {
    setSelectedExam(exam);
    setPastExamDrawerVisible(true);
  };

  const calculatePercentage = (score: bigint, total: bigint) => {
    if (total === BigInt(0)) return 0;
    return Number((score * BigInt(100)) / total);
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
        <div className="flex justify-between items-center mb-8">
          <div className="flex flex-col gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.history.back()}
              className="cursor-pointer py-2 text-[#F5F5DC] rounded-lg transition-colors flex items-center gap-2 "
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Courses
            </motion.button>
            <h1 className="text-3xl font-bold text-[#F5F5DC]">
              {isTutor ? "My Created Exams" : "Available Exams"}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!isTutor &&
            examIds.map((examId, index) => (
              <StudentExamCard
                key={examId.toString()}
                examId={examId}
                index={index}
                enrolledCourseIds={enrolledCourseIds}
                studentAddress={address}
                onClick={handleExamClick}
                onViewPastQuestions={handleViewPastQuestions}
              />
            ))}

          {isTutor &&
            examIds.map((examId, index) => (
              <TutorExamCard
                key={examId.toString()}
                examId={examId}
                index={index}
                tutorAddress={address}
              />
            ))}
        </div>

        {!isTutor && examIds.length === 0 && (
          <div className="text-center py-16 bg-[#F5F5DC] rounded-xl border-2 border-[#8D6E63]">
            <p className="text-[#5D4037] text-xl">No exams available</p>
            <p className="text-[#6D4C41] mt-2">
              Enroll in courses to see available exams
            </p>
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
          <div className="text-center py-16 ">
            <p className="text-[#FFF8E1] text-xl">No exams created yet</p>

          </div>
        )}

        {/* Take Exam Drawer */}
        <Drawer
          title={
            <span className="text-[#5D4037] text-xl font-bold">
              Taking Exam: {selectedExam?.title}
            </span>
          }
          placement="right"
          onClose={() => setTakeExamDrawerVisible(false)}
          open={takeExamDrawerVisible}
          width={1500}
          closeIcon={
            <div className="text-[#8B4513] hover:text-[#654321] transition-colors">
              ✕
            </div>
          }
          maskClosable={false}
          styles={{
            body: { backgroundColor: "#F5F5DC" },
            header: { backgroundColor: "#F5F5DC" },
            content: { backgroundColor: "#F5F5DC" }
          }}
        >
          <div className="space-y-6">
            {examQuestions.map((question, index) => (
              <div
                key={index}
                className="border border-[#8D6E63] bg-[#FFF8E1] rounded-lg p-6"
              >
                <h4 className="font-semibold mb-4 text-[#5D4037] text-lg">
                  Question {index + 1}: {question.questionText}
                </h4>
                <div className="space-y-3">
                  {question.options.map((option, optIndex) => {
                    const optionLetters = ["A", "B", "C", "D"];
                    const optionLetter = optionLetters[optIndex];

                    return (
                      <label
                        key={optIndex}
                        className="flex items-center p-3 rounded-lg cursor-pointer transition-colors hover:bg-[#F5E6D3] w-full"
                      >
                        <input
                          type="radio"
                          name={`question-${index}`}
                          value={optIndex}
                          checked={answers[index] === optIndex}
                          onChange={(e) =>
                            handleAnswerChange(index, parseInt(e.target.value))
                          }
                          className="hidden"
                        />
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full border-2 mr-4 flex-shrink-0 ${answers[index] === optIndex
                            ? "border-[#8B4513] bg-[#8B4513] text-[#F5F5DC]"
                            : "border-[#8D6E63] text-[#5D4037] bg-transparent"
                            } font-semibold transition-colors`}
                        >
                          {optionLetter}
                        </div>
                        <span className="text-[#5D4037] text-base flex-1">
                          {option}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex gap-2">
              <button
                onClick={handleSubmitExam}
                disabled={
                  answers.some((answer) => answer === -1) || submittingExam
                }
                className={`w-full py-3 px-4 cursor-pointer rounded-lg font-medium transition-colors text-lg ${answers.some((answer) => answer === -1) || submittingExam
                  ? "bg-gray-400 cursor-not-allowed text-gray-200"
                  : "bg-[#8B4513] hover:bg-[#6D4C41] text-[#F5F5DC]"
                  }`}
              >
                {submittingExam ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  "Submit Exam"
                )}
              </button>
              <button
                onClick={() => setTakeExamDrawerVisible(false)}
                className="w-full py-3 px-4 bg-gray-300 cursor-pointer hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors text-lg"
              >
                Cancel
              </button>
            </div>

            <div className="mt-4 flex items-start justify-center gap-2 text-[#5D4037] opacity-80 px-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 flex-shrink-0 mt-0.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <p className="text-sm text-center leading-tight">
                <strong>Important:</strong> Please do not close this panel manually after clicking submit. The drawer will automatically close once your exam is successfully submitted.
              </p>
            </div>
          </div>
        </Drawer>

        {/* Results Drawer */}
        <Drawer
          title={
            <span className="text-[#5D4037] text-xl font-bold">
              Exam Results: {selectedExam?.title}
            </span>
          }
          placement="right"
          onClose={() => setResultsDrawerVisible(false)}
          open={resultsDrawerVisible}
          closeIcon={
            <div className="text-[#8B4513] hover:text-[#654321] transition-colors">
              ✕
            </div>
          }
          width={600}
          styles={{
            body: { backgroundColor: "#F5F5DC" },
            header: { backgroundColor: "#F5F5DC" },
            content: { backgroundColor: "#F5F5DC" }
          }}
        >
          {examScore && selectedExam && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-[#5D4037] mb-4">
                  Exam Completed!
                </h3>

                <div className="mb-6 flex justify-center">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#8B4513"
                        strokeWidth="3"
                        strokeDasharray={`${calculatePercentage(
                          examScore.score,
                          examScore.total
                        )}, 100`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-[#5D4037]">
                        {calculatePercentage(examScore.score, examScore.total)}
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <p className="text-[#5D4037] text-lg">
                    Score: <strong>{examScore.score.toString()}</strong> out of{" "}
                    <strong>{examScore.total.toString()}</strong>
                  </p>
                  <p className="text-[#6D4C41] text-lg">
                    Percentage:{" "}
                    <strong>
                      {calculatePercentage(examScore.score, examScore.total)}%
                    </strong>
                  </p>
                  <p className="text-[#8D6E63]">
                    Status: <strong>Completed</strong>
                  </p>
                </div>

                <button
                  onClick={() => setResultsDrawerVisible(false)}
                  className="w-full py-3 px-4 bg-[#8B4513] hover:bg-[#6D4C41] text-[#F5F5DC] rounded-lg font-medium transition-colors text-lg"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Drawer>

        <PastExamQuestions
          examTitle={selectedExam?.title || ""}
          examId={selectedExam?.examId} // Pass the examId directly
          isVisible={pastExamDrawerVisible}
          onClose={() => {
            setPastExamDrawerVisible(false);
          }}
        />
      </div>
    </div>
  );
}