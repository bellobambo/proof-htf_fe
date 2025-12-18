"use client";

import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./contract";
import { useEffect, useMemo, useState } from "react";
import { useSmartSession } from "./useSmartSession";

// Reuse existing interfaces and enums
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

// FIXED: Return only the course count, not individual courses
// Let the component handle fetching individual courses
export function useGetAllCourses() {
  const { data: courseCount, error, isLoading } = useCourseCounter();

  const count = courseCount ? Number(courseCount) : 0;

  return {
    courseCount: count,
    isLoading,
    error,
  };
}

// FIXED: Return metadata instead of fetching all exams
// Let the component handle individual exam fetches
export function useGetAvailableExamsForStudent(
  studentAddress: `0x${string}` | undefined,
  options?: { query?: { enabled?: boolean } }
) {
  const enabled = options?.query?.enabled ?? !!studentAddress;

  const {
    data: enrolledCourses,
    isLoading: coursesLoading,
    error: coursesError,
  } = useGetEnrolledCourses(studentAddress, {
    query: { enabled },
  });

  const { data: examCount, isLoading: examCountLoading } = useExamCounter();

  const examIds = useMemo(() => {
    if (!examCount) return [];
    return Array.from({ length: Number(examCount) }, (_, i) => BigInt(i));
  }, [examCount]);

  const isLoading = coursesLoading || examCountLoading;

  return {
    examIds,
    enrolledCourses,
    isLoading,
    error: coursesError,
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
  const { address } = useAccount();
  const { data: userData } = useUsers(address);

  const isStudent =
    userData?.role === UserRole.STUDENT && userData?.isRegistered;

  const result = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getPastExamForRevision",
    args: examId !== undefined ? [examId] : undefined,
    query: {
      enabled: examId !== undefined && isStudent && !!address,
    },
  });

  // Add debug logging
  useEffect(() => {
    if (examId && address) {
      console.group("🎯 useGetPastExamForRevision Debug");
      console.log("Address:", address);
      console.log("Exam ID:", examId.toString());
      console.log("User Data:", userData);
      console.log("Is Student:", isStudent);
      console.log(
        "Hook Enabled:",
        examId !== undefined && isStudent && !!address
      );
      console.groupEnd();
    }
  }, [examId, address, userData, isStudent]);

  // Transform the data
  const transformedData = useMemo(() => {
    if (!result.data) return null;

    const data = result.data as readonly [
      readonly string[], // questionTexts
      readonly [string, string, string, string][], // questionOptions
    ];

    console.log("📦 Past Exam Data Received:", {
      questionCount: data[0].length,
      optionsCount: data[1].length,
    });

    return {
      questionTexts: data[0],
      questionOptions: data[1],
    };
  }, [result.data]);

  return {
    ...result,
    data: transformedData,
    isStudent,
    userData,
  };
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
  const result = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "users",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  type UserResponse = readonly [string, number, boolean] | undefined;
  const userResponse = result.data as UserResponse;

  const transformedData: User | undefined = userResponse
    ? {
        name: userResponse[0],
        role: userResponse[1] as UserRole,
        isRegistered: userResponse[2],
      }
    : undefined;

  return {
    ...result,
    data: transformedData,
  };
}

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

  // Auto refresh on successful confirmation
  useEffect(() => {
    if (isConfirmed) {
      window.location.reload();
    }
  }, [isConfirmed]);

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

  // Auto refresh on successful confirmation
  useEffect(() => {
    if (isConfirmed) {
      window.location.reload();
    }
  }, [isConfirmed]);

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

  // Auto refresh on successful confirmation
  useEffect(() => {
    if (isConfirmed) {
      window.location.reload();
    }
  }, [isConfirmed]);

  return {
    enrollInCourse,
    hash,
    isLoading: isPending || isConfirming,
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

  // Auto refresh on successful confirmation
  useEffect(() => {
    if (isConfirmed) {
      window.location.reload();
    }
  }, [isConfirmed]);

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

  // Auto refresh on successful confirmation
  useEffect(() => {
    if (isConfirmed) {
      window.location.reload();
    }
  }, [isConfirmed]);

  return {
    takeExam,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}
