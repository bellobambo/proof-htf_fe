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

// Individual exam card component for students
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
  onViewPastQuestions: (exam: Exam) => void;
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
      <p className="text-[#8D6E63] text-sm mb-3">
        Course ID: {exam.courseId.toString()}
      </p>
      <div className={`inline-block px-3 py-1 rounded-full text-sm border-2 font-medium ${isCompleted
        ? "bg-[#E8F5E8] border-[#4CAF50] text-[#2E7D32]"
        : "bg-[#FFF8E1] border-[#FFA000] text-[#5D4037]"
        }`}>
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
              onViewPastQuestions(exam);
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
  const { examIds, enrolledCourses, isLoading } = useGetAvailableExamsForStudent(address);
  const { data: tutorCourses } = useGetTutorCourses(address);
  const { takeExam, isPending: submittingExam, isConfirmed, error } = useTakeExam();

  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [takeExamDrawerVisible, setTakeExamDrawerVisible] = useState(false);
  const [resultsDrawerVisible, setResultsDrawerVisible] = useState(false);
  const [examScore, setExamScore] = useState<{ score: bigint, total: bigint } | null>(null);
  const [pastExamData, setPastExamData] = useState<any>(null);
  const [pastExamDrawerVisible, setPastExamDrawerVisible] = useState(false);
  const [loadingPastExam, setLoadingPastExam] = useState(false);

  const isTutor = userData?.role === UserRole.TUTOR;

  const enrolledCourseIds = new Set(
    enrolledCourses?.map(course => course.courseId) || []
  );

  const { data: questionsData } = useGetExamQuestions(selectedExam?.examId);
  
  const { data: pastExamReview, refetch: refetchPastExam, isError: isPastExamError, error: pastExamError } = useGetPastExamForRevision(
    selectedExam?.examId
  );

  useEffect(() => {
    if (questionsData && selectedExam) {
      const transformedQuestions: ExamQuestion[] = questionsData[0].map((text, index) => ({
        questionText: text,
        options: [...questionsData[1][index]] as [string, string, string, string],
        correctAnswer: 0
      }));
      setExamQuestions(transformedQuestions);
      setAnswers(new Array(transformedQuestions.length).fill(-1));
    }
  }, [questionsData, selectedExam]);

  const handleExamClick = (exam: Exam, isCompleted: boolean, score: bigint) => {
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
    if (answers.some(answer => answer === -1)) {
      toast.error("Please answer all questions");
      return;
    }

    if (selectedExam) {
      takeExam(selectedExam.examId, answers.map(answer => BigInt(answer)));
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

  const handleViewPastQuestions = async (exam: Exam) => {
    setSelectedExam(exam);
    setLoadingPastExam(true);

    try {
      const result = await refetchPastExam();

      console.log("Past exam result:", result);

      if (result.isError) {
        console.error("Past exam error:", result.error);
        toast.error("You must complete this exam before viewing past questions.");
        return;
      }

      if (result.data) {
        setPastExamData(result.data);
        setPastExamDrawerVisible(true);
        toast.success("Past questions loaded successfully!");
      } else {
        toast.error("No past exam data available. Please ensure you've completed this exam.");
      }
    } catch (error: any) {
      console.error("Error accessing past questions:", error);
      
      if (error?.message?.includes("Not enrolled in course")) {
        toast.error("You are not enrolled in this course");
      } else if (error?.message?.includes("Must complete exam before viewing revision")) {
        toast.error("You must complete the exam before viewing past questions");
      } else {
        toast.error("Failed to load past questions. Please try again.");
      }
    } finally {
      setLoadingPastExam(false);
    }
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
              className="cursor-pointer py-2 px-4 text-[#F5F5DC] rounded-lg transition-colors flex items-center gap-2 hover:bg-[#6D4C41]"
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!isTutor && examIds.map((examId, index) => (
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

          {isTutor && examIds.map((examId, index) => (
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

        {/* Take Exam Drawer */}
        <Drawer
          title={<span className="text-[#5D4037] text-xl font-bold">Taking Exam: {selectedExam?.title}</span>}
          placement="right"
          onClose={() => setTakeExamDrawerVisible(false)}
          open={takeExamDrawerVisible}
          width={1500}
          closeIcon={<div className="text-[#8B4513] hover:text-[#654321] transition-colors">✕</div>}
          maskClosable={false}
          styles={{
            body: { backgroundColor: '#F5F5DC' },
            header: { backgroundColor: '#F5F5DC' },
            content: { backgroundColor: '#F5F5DC' }
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
                    const optionLetters = ['A', 'B', 'C', 'D'];
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
                          onChange={(e) => handleAnswerChange(index, parseInt(e.target.value))}
                          className="hidden"
                        />
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 mr-4 flex-shrink-0 ${answers[index] === optIndex
                          ? 'border-[#8B4513] bg-[#8B4513] text-[#F5F5DC]'
                          : 'border-[#8D6E63] text-[#5D4037] bg-transparent'
                          } font-semibold transition-colors`}>
                          {optionLetter}
                        </div>
                        <span className="text-[#5D4037] text-base flex-1">{option}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex gap-2">
              <button
                onClick={handleSubmitExam}
                disabled={answers.some(answer => answer === -1) || submittingExam}
                className={`w-full py-3 px-4 cursor-pointer rounded-lg font-medium transition-colors text-lg ${answers.some(answer => answer === -1) || submittingExam
                  ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                  : 'bg-[#8B4513] hover:bg-[#6D4C41] text-[#F5F5DC]'
                  }`}
              >
                {submittingExam ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Submit Exam'
                )}
              </button>
              <button
                onClick={() => setTakeExamDrawerVisible(false)}
                className="w-full py-3 px-4 bg-gray-300 cursor-pointer hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors text-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </Drawer>

        {/* Results Drawer - Simplified without "Assess Past Questions" button */}
        <Drawer
          title={<span className="text-[#5D4037] text-xl font-bold">Exam Results: {selectedExam?.title}</span>}
          placement="right"
          onClose={() => setResultsDrawerVisible(false)}
          open={resultsDrawerVisible}
          closeIcon={<div className="text-[#8B4513] hover:text-[#654321] transition-colors">✕</div>}
          width={600}
          styles={{
            body: { backgroundColor: '#F5F5DC' },
            header: { backgroundColor: '#F5F5DC' },
            content: { backgroundColor: '#F5F5DC' }
          }}
        >
          {examScore && selectedExam && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-[#5D4037] mb-4">Exam Completed!</h3>

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
                        strokeDasharray={`${calculatePercentage(examScore.score, examScore.total)}, 100`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-[#5D4037]">
                        {calculatePercentage(examScore.score, examScore.total)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <p className="text-[#5D4037] text-lg">
                    Score: <strong>{examScore.score.toString()}</strong> out of <strong>{examScore.total.toString()}</strong>
                  </p>
                  <p className="text-[#6D4C41] text-lg">
                    Percentage: <strong>{calculatePercentage(examScore.score, examScore.total)}%</strong>
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

        {/* Past Exam Review Drawer */}
        <Drawer
          title={<span className="text-[#5D4037] text-xl font-bold">Exam Review: {selectedExam?.title}</span>}
          placement="right"
          onClose={() => setPastExamDrawerVisible(false)}
          open={pastExamDrawerVisible}
          width={1500}
          closeIcon={<div className="text-[#8B4513] hover:text-[#654321] transition-colors">✕</div>}
          maskClosable={false}
          styles={{
            body: { backgroundColor: '#F5F5DC' },
            header: { backgroundColor: '#F5F5DC' },
            content: { backgroundColor: '#F5F5DC' }
          }}
        >
          {pastExamData && (
            <div className="space-y-6">
              <div className="bg-[#FFF8E1] border border-[#8D6E63] rounded-lg p-6">
                <h3 className="text-xl font-bold text-[#5D4037] mb-4">Exam Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-[#6D4C41]">Your Score</p>
                    <p className="text-2xl font-bold text-[#8B4513]">{pastExamData[5]?.toString() || '0'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[#6D4C41]">Maximum Score</p>
                    <p className="text-2xl font-bold text-[#8B4513]">{pastExamData[6]?.toString() || '0'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[#6D4C41]">Percentage</p>
                    <p className="text-2xl font-bold text-[#8B4513]">
                      {pastExamData[5] && pastExamData[6]
                        ? calculatePercentage(pastExamData[5], pastExamData[6])
                        : 0}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[#6D4C41]">Questions</p>
                    <p className="text-2xl font-bold text-[#8B4513]">{pastExamData[0]?.length || 0}</p>
                  </div>
                </div>
              </div>

              {pastExamData[0]?.map((question: string, index: number) => {
                const studentAnswer = pastExamData[3]?.[index];
                const correctAnswer = pastExamData[2]?.[index];
                const isCorrect = pastExamData[4]?.[index];
                const options = pastExamData[1]?.[index] || ['', '', '', ''];

                return (
                  <div
                    key={index}
                    className={`border-2 rounded-lg p-6 ${isCorrect
                      ? 'border-[#4CAF50] bg-[#E8F5E8]'
                      : 'border-[#F44336] bg-[#FFEBEE]'
                      }`}
                  >
                    <h4 className="font-semibold mb-4 text-[#5D4037] text-lg">
                      Question {index + 1}: {question}
                    </h4>

                    <div className="space-y-3 mb-4">
                      {options.map((option: string, optIndex: number) => {
                        const optionLetters = ['A', 'B', 'C', 'D'];
                        const optionLetter = optionLetters[optIndex];
                        const isStudentAnswer = studentAnswer === BigInt(optIndex);
                        const isCorrectAnswer = correctAnswer === BigInt(optIndex);

                        return (
                          <div
                            key={optIndex}
                            className={`flex items-center p-3 rounded-lg border-2 ${isCorrectAnswer
                              ? 'border-[#4CAF50] bg-[#C8E6C9]'
                              : isStudentAnswer && !isCorrectAnswer
                                ? 'border-[#F44336] bg-[#FFCDD2]'
                                : 'border-[#8D6E63] bg-[#FFF8E1]'
                              }`}
                          >
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 mr-4 flex-shrink-0 ${isCorrectAnswer
                              ? 'border-[#4CAF50] bg-[#4CAF50] text-white'
                              : isStudentAnswer && !isCorrectAnswer
                                ? 'border-[#F44336] bg-[#F44336] text-white'
                                : 'border-[#8D6E63] text-[#5D4037] bg-transparent'
                              } font-semibold`}>
                              {optionLetter}
                            </div>
                            <span className="text-[#5D4037] text-base flex-1">{option}</span>

                            {isCorrectAnswer && (
                              <span className="ml-2 px-2 py-1 bg-[#4CAF50] text-white text-sm rounded-full">
                                Correct Answer
                              </span>
                            )}
                            {isStudentAnswer && !isCorrectAnswer && (
                              <span className="ml-2 px-2 py-1 bg-[#F44336] text-white text-sm rounded-full">
                                Your Answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className={`p-3 rounded-lg ${isCorrect ? 'bg-[#4CAF50] text-white' : 'bg-[#F44336] text-white'
                      }`}>
                      <p className="font-semibold">
                        {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                      </p>
                      <p>
                        Your answer: {String.fromCharCode(65 + Number(studentAnswer || 0))} |
                        Correct answer: {String.fromCharCode(65 + Number(correctAnswer || 0))}
                      </p>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={() => setPastExamDrawerVisible(false)}
                className="w-full py-3 px-4 bg-[#8B4513] hover:bg-[#6D4C41] text-[#F5F5DC] rounded-lg font-medium transition-colors text-lg"
              >
                Close Review
              </button>
            </div>
          )}
        </Drawer>
      </div>
    </div>
  );
}