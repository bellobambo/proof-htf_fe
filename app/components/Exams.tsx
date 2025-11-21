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
  Exam
} from "@/utils/useContractHooks";

// Individual exam card component to properly use hooks
function ExamCard({ 
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
        <div className="text-[#5D4037]">Loading exam...</div>
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

export default function ExamsPage() {
  const { address } = useAccount();
  const { data: userData } = useUsers(address);
  const { examIds, enrolledCourses, isLoading } = useGetAvailableExamsForStudent(address);
  const { data: tutorCourses } = useGetTutorCourses(address);
  const { takeExam, isPending: submittingExam } = useTakeExam();
  const { createExam, isPending: creatingExam } = useCreateExam();
  
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [takeExamDrawerVisible, setTakeExamDrawerVisible] = useState(false);
  const [createExamDrawerVisible, setCreateExamDrawerVisible] = useState(false);
  
  // New exam form state
  const [newExamTitle, setNewExamTitle] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<bigint | null>(null);
  const [questions, setQuestions] = useState<{
    text: string;
    options: [string, string, string, string];
    correctAnswer: number;
  }[]>([]);

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

  const handleCreateExam = () => {
    if (!newExamTitle.trim() || !selectedCourseId || questions.length === 0) {
      toast.error("Please fill all fields and add at least one question");
      return;
    }

    const questionTexts = questions.map(q => q.text);
    const questionOptions = questions.map(q => q.options);
    const correctAnswers = questions.map(q => BigInt(q.correctAnswer));

    createExam(selectedCourseId, newExamTitle, questionTexts, questionOptions, correctAnswers);
    toast.success("Creating exam...");
    setCreateExamDrawerVisible(false);
    resetCreateExamForm();
  };

  const resetCreateExamForm = () => {
    setNewExamTitle("");
    setSelectedCourseId(null);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#5D4037] flex items-center justify-center">
        <div className="text-[#F5F5DC] text-xl">Loading exams...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#5D4037] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#F5F5DC]">
            {isTutor ? "Exam Management" : "Available Exams"}
          </h1>
          {isTutor && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCreateExamDrawerVisible(true)}
              className="px-6 py-3 bg-[#8D6E63] text-[#F5F5DC] rounded-lg hover:bg-[#A1887F] transition-colors"
            >
              Create New Exam
            </motion.button>
          )}
        </div>

        {/* Exams Grid */}
        {!isTutor && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {examIds.map((examId, index) => (
              <ExamCard
                key={examId.toString()}
                examId={examId}
                index={index}
                enrolledCourseIds={enrolledCourseIds}
                studentAddress={address}
                onClick={handleExamClick}
              />
            ))}
          </div>
        )}

        {!isTutor && examIds.length === 0 && (
          <div className="text-center py-16 bg-[#F5F5DC] rounded-xl border-2 border-[#8D6E63]">
            <p className="text-[#5D4037] text-xl">No exams available</p>
            <p className="text-[#6D4C41] mt-2">Enroll in courses to see available exams</p>
          </div>
        )}

        {isTutor && (
          <div className="text-center py-16 bg-[#F5F5DC] rounded-xl border-2 border-[#8D6E63]">
            <p className="text-[#5D4037] text-xl">
              Use "Create New Exam" to create exams for your courses
            </p>
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
                <p className="text-sm text-[#8D6E63]">
                  Exam ID: {selectedExam.examId.toString()}
                </p>
                <p className="text-sm text-[#8D6E63]">
                  Course ID: {selectedExam.courseId.toString()}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="primary"
                  onClick={handleTakeExam}
                  className="w-full bg-[#5D4037] hover:bg-[#6D4C41]"
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
                className="w-full bg-[#5D4037] hover:bg-[#6D4C41]"
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

        {/* Create Exam Drawer */}
        <Drawer
          title={<span className="text-[#5D4037]">Create New Exam</span>}
          placement="right"
          onClose={() => setCreateExamDrawerVisible(false)}
          open={createExamDrawerVisible}
          width={600}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-[#5D4037]">Exam Title</label>
              <input
                type="text"
                value={newExamTitle}
                onChange={(e) => setNewExamTitle(e.target.value)}
                placeholder="Enter exam title"
                className="w-full p-2 border-2 border-[#D7CCC8] rounded-md focus:border-[#5D4037] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-[#5D4037]">Select Course</label>
              <select
                value={selectedCourseId?.toString() || ""}
                onChange={(e) => setSelectedCourseId(BigInt(e.target.value))}
                className="w-full p-2 border-2 border-[#D7CCC8] rounded-md focus:border-[#5D4037] focus:outline-none"
              >
                <option value="">Select a course</option>
                {tutorCourses?.map((course) => (
                  <option key={course.courseId.toString()} value={course.courseId.toString()}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t-2 border-[#D7CCC8] pt-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-[#5D4037]">Questions</h4>
                <Button 
                  type="dashed" 
                  onClick={addQuestion}
                  className="border-[#8D6E63] text-[#5D4037]"
                >
                  Add Question
                </Button>
              </div>

              {questions.map((question, index) => (
                <div key={index} className="border-2 border-[#D7CCC8] p-4 rounded mb-4 bg-[#F5F5DC]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-[#5D4037]">Question {index + 1}</span>
                    <button
                      onClick={() => removeQuestion(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <input
                    type="text"
                    placeholder="Question text"
                    value={question.text}
                    onChange={(e) => updateQuestion(index, "text", e.target.value)}
                    className="w-full p-2 border-2 border-[#D7CCC8] rounded-md mb-3 focus:border-[#5D4037] focus:outline-none"
                  />
                  
                  {question.options.map((option, optIndex) => (
                    <input
                      key={optIndex}
                      type="text"
                      placeholder={`Option ${optIndex + 1}`}
                      value={option}
                      onChange={(e) => updateQuestion(index, `option${optIndex}`, e.target.value)}
                      className="w-full p-2 border-2 border-[#D7CCC8] rounded-md mb-2 focus:border-[#5D4037] focus:outline-none"
                    />
                  ))}
                  
                  <select
                    value={question.correctAnswer}
                    onChange={(e) => updateQuestion(index, "correctAnswer", parseInt(e.target.value))}
                    className="w-full p-2 border-2 border-[#D7CCC8] rounded-md focus:border-[#5D4037] focus:outline-none"
                  >
                    <option value={0}>Correct Answer: Option 1</option>
                    <option value={1}>Correct Answer: Option 2</option>
                    <option value={2}>Correct Answer: Option 3</option>
                    <option value={3}>Correct Answer: Option 4</option>
                  </select>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                type="primary"
                loading={creatingExam}
                onClick={handleCreateExam}
                className="w-full bg-[#5D4037] hover:bg-[#6D4C41]"
              >
                Create Exam
              </Button>
              <Button 
                onClick={() => setCreateExamDrawerVisible(false)}
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