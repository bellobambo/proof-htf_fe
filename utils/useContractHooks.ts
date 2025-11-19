"use client";

import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./contract";
import { useEffect, useMemo } from "react";

// Reuse existing interfaces and enums from your documentation
export enum UserRole {
  TUTOR = 0,
  STUDENT = 1,
}

export interface Course {
  courseId: bigint;
  title: string;
  tutor: `0x${string}`;
  tutorName: string;
  isActive: boolean;
}

export interface User {
  name: string;
  role: UserRole;
  isRegistered: boolean;
}

export interface Exam {
  examId: bigint;
  courseId: bigint;
  title: string;
  questionCount: bigint;
  isActive: boolean;
  creator: `0x${string}`;
}

export interface ExamSession {
  examId: bigint;
  student: `0x${string}`;
  score: bigint;
  isCompleted: boolean;
}

export interface ExamResults {
  rawScore: bigint;
  answers: readonly bigint[];
  isCompleted: boolean;
}

export interface ExamScore {
  rawScore: bigint;
  isCompleted: boolean;
}

export interface ExamWithStatus {
  exam: Exam;
  completionStatus: boolean;
  score: bigint;
}

export interface ExamReview {
  questionTexts: readonly string[];
  questionOptions: readonly [string, string, string, string][];
  correctAnswers: readonly bigint[];
  studentAnswers: readonly bigint[];
  isCorrect: readonly boolean[];
  totalScore: bigint;
  maxScore: bigint;
}

export interface ExamQuestion {
  questionText: string;
  options: [string, string, string, string];
  correctAnswer: number;
}

export interface ExamAnswersComparison {
  correctAnswers: readonly bigint[];
  studentAnswers: readonly bigint[];
  isCorrect: readonly boolean[];
  isCompleted: boolean;
}

export type QuestionOptions = [string, string, string, string];

export function useGetAllCourses() {
  const {
    data: courseCount,
    error: countError,
    isLoading: countLoading,
  } = useCourseCounter();

  // Create an array of course IDs from 0 to courseCount-1
  const courseIds = useMemo(() => {
    if (!courseCount) return [];
    return Array.from({ length: Number(courseCount) }, (_, i) => BigInt(i));
  }, [courseCount]);

  // Fetch each course individually
  const courseQueries = courseIds.map((courseId: any) =>
    useGetCourse(courseId)
  );

  // Combine all course data
  const courses: Course[] = useMemo(() => {
    return courseQueries
      .map((query: any) => query.data)
      .filter(
        (course: any): course is Course =>
          course !== undefined && course.isActive
      );
  }, [courseQueries]);

  const isLoading =
    countLoading || courseQueries.some((query: any) => query.isLoading);
  const error =
    countError || courseQueries.find((query: any) => query.error)?.error;

  return {
    data: courses,
    isLoading,
    error,
  };
}

// Fixed implementation for getting available exams for a student
export function useGetAvailableExamsForStudent(
  studentAddress: `0x${string}` | undefined,
  options?: { query?: { enabled?: boolean } }
) {
  const enabled = options?.query?.enabled ?? !!studentAddress;

  // Get enrolled courses for the student
  const {
    data: enrolledCourses,
    isLoading: coursesLoading,
    error: coursesError,
  } = useGetEnrolledCourses(studentAddress, {
    query: { enabled },
  });

  // Get exam counter to know how many exams exist
  const { data: examCount, isLoading: examCountLoading } = useExamCounter();

  // Create array of all exam IDs
  const allExamIds = useMemo(() => {
    if (!examCount) return [];
    return Array.from({ length: Number(examCount) }, (_, i) => BigInt(i));
  }, [examCount]);

  // Fetch all exams
  const examQueries = allExamIds.map((examId: any) => useGetExam(examId));

  // Fetch exam sessions for the student
  const examSessionQueries = allExamIds.map((examId: any) =>
    useExamSessions(examId, studentAddress)
  );

  // Combine data to find available exams
  const availableExams: ExamWithStatus[] = useMemo(() => {
    if (!enrolledCourses || !examQueries.length) return [];

    const enrolledCourseIds = new Set(
      enrolledCourses.map((course) => course.courseId)
    );

    const results = examQueries.map((query: any, index: any) => {
      const exam = query.data;
      const sessionData = examSessionQueries[index]?.data;

      if (!exam || !exam.isActive) return null;

      // Convert tuple to ExamSession object
      const session: ExamSession | null = sessionData
        ? {
            examId: sessionData[0],
            student: sessionData[1],
            score: sessionData[2],
            isCompleted: sessionData[3],
          }
        : null;

      // Check if exam belongs to an enrolled course and student hasn't completed it
      const isEnrolled = enrolledCourseIds.has(exam.courseId);
      const isCompleted = session?.isCompleted ?? false;

      if (isEnrolled && !isCompleted) {
        return {
          exam,
          completionStatus: isCompleted,
          score: session?.score ?? BigInt(0),
        } as ExamWithStatus; // Explicit type assertion here
      }

      return null;
    });

    // Use filter with Boolean and type assertion
    return results.filter(Boolean) as ExamWithStatus[];
  }, [enrolledCourses, examQueries, examSessionQueries]);

  const isLoading =
    coursesLoading ||
    examCountLoading ||
    examQueries.some((query: any) => query.isLoading) ||
    examSessionQueries.some((query: any) => query.isLoading);

  const error =
    coursesError || examQueries.find((query: any) => query.error)?.error;

  return {
    data: availableExams,
    isLoading,
    error,
  };
}

// Enhanced useGetEnrolledCourses to accept options
export function useGetEnrolledCourses(
  studentAddress: `0x${string}` | undefined,
  options?: { query?: { enabled?: boolean } }
) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getEnrolledCourses",
    args: studentAddress ? [studentAddress] : undefined,
    query: {
      enabled: options?.query?.enabled ?? !!studentAddress,
    },
  });
}

// Keep all your existing view function hooks exactly as they are...
export function useCourseCounter() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "courseCounter",
  });
}

export function useCourseEnrollments(
  courseId: bigint | undefined,
  studentAddress: `0x${string}` | undefined
) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "courseEnrollments",
    args:
      courseId !== undefined && studentAddress
        ? [courseId, studentAddress]
        : undefined,
    query: {
      enabled: courseId !== undefined && !!studentAddress,
    },
  });
}

export function useCourseExams(
  courseId: bigint | undefined,
  index: bigint | undefined
) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "courseExams",
    args:
      courseId !== undefined && index !== undefined
        ? [courseId, index]
        : undefined,
    query: {
      enabled: courseId !== undefined && index !== undefined,
    },
  });
}

export function useCourses(courseId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "courses",
    args: courseId !== undefined ? [courseId] : undefined,
    query: {
      enabled: courseId !== undefined,
    },
  });
}

export function useExamCounter() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "examCounter",
  });
}

export function useExamCorrectAnswers(
  examId: bigint | undefined,
  questionIndex: bigint | undefined
) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "examCorrectAnswers",
    args:
      examId !== undefined && questionIndex !== undefined
        ? [examId, questionIndex]
        : undefined,
    query: {
      enabled: examId !== undefined && questionIndex !== undefined,
    },
  });
}

export function useExamOptions(
  examId: bigint | undefined,
  questionIndex: bigint | undefined,
  optionIndex: bigint | undefined
) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "examOptions",
    args:
      examId !== undefined &&
      questionIndex !== undefined &&
      optionIndex !== undefined
        ? [examId, questionIndex, optionIndex]
        : undefined,
    query: {
      enabled:
        examId !== undefined &&
        questionIndex !== undefined &&
        optionIndex !== undefined,
    },
  });
}

export function useExamQuestions(
  examId: bigint | undefined,
  questionIndex: bigint | undefined
) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "examQuestions",
    args:
      examId !== undefined && questionIndex !== undefined
        ? [examId, questionIndex]
        : undefined,
    query: {
      enabled: examId !== undefined && questionIndex !== undefined,
    },
  });
}

export function useExamSessions(
  examId: bigint | undefined,
  studentAddress: `0x${string}` | undefined
) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "examSessions",
    args:
      examId !== undefined && studentAddress
        ? [examId, studentAddress]
        : undefined,
    query: {
      enabled: examId !== undefined && !!studentAddress,
    },
  });
}

export function useExams(examId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "exams",
    args: examId !== undefined ? [examId] : undefined,
    query: {
      enabled: examId !== undefined,
    },
  });
}

export function useGetCourse(courseId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getCourse",
    args: courseId !== undefined ? [courseId] : undefined,
    query: {
      enabled: courseId !== undefined,
    },
  });
}

export function useGetExam(examId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getExam",
    args: examId !== undefined ? [examId] : undefined,
    query: {
      enabled: examId !== undefined,
    },
  });
}

export function useGetExamQuestions(examId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getExamQuestions",
    args: examId !== undefined ? [examId] : undefined,
    query: {
      enabled: examId !== undefined,
    },
  });
}

export function useGetExamResults(
  examId: bigint | undefined,
  studentAddress: `0x${string}` | undefined
) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getExamResults",
    args:
      examId !== undefined && studentAddress
        ? [examId, studentAddress]
        : undefined,
    query: {
      enabled: examId !== undefined && !!studentAddress,
    },
  });
}

export function useGetPastExamForRevision(examId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getPastExamForRevision",
    args: examId !== undefined ? [examId] : undefined,
    query: {
      enabled: examId !== undefined,
    },
  });
}

export function useGetTutorCourses(tutorAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getTutorCourses",
    args: tutorAddress ? [tutorAddress] : undefined,
    query: {
      enabled: !!tutorAddress,
    },
  });
}

export function useRegisteredUsers(userAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "registeredUsers",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

export function useUsers(userAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "users",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

// Keep all your existing write hooks exactly as they are...
export function useCreateCourse() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const createCourse = (title: string) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "createCourse",
      args: [title],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    createCourse,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useCreateExam() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const createExam = (
    courseId: bigint,
    title: string,
    questionTexts: string[],
    questionOptions: [string, string, string, string][],
    correctAnswers: bigint[]
  ) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "createExam",
      args: [courseId, title, questionTexts, questionOptions, correctAnswers],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    createExam,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useEnrollInCourse() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const enrollInCourse = (courseId: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "enrollInCourse",
      args: [courseId],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    enrollInCourse,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useRegisterUser() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const registerUser = (name: string, role: UserRole) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "registerUser",
      args: [name, role],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    registerUser,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useTakeExam() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const takeExam = (examId: bigint, answers: bigint[]) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "takeExam",
      args: [examId, answers],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    takeExam,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}
