"use client";

import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./contract";
import { useEffect, useMemo } from "react";
import { useSmartAccountContext } from "@/app/components/SmartAccountContext";
import toast from "react-hot-toast";
// 1. Ensure you import the Smart Account Context or Hook
// import { useSmartAccountContext } from "@/context/SmartAccountContext";

// --- Interfaces & Enums (Same as before) ---
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

// --- Read Hooks (Unchanged) ---

export function useGetAllCourses() {
  const { data: courseCount, error, isLoading } = useCourseCounter();
  const count = courseCount ? Number(courseCount) : 0;
  return { courseCount: count, isLoading, error };
}

export function useGetAvailableExamsForStudent(
  studentAddress: `0x${string}` | undefined,
  options?: { query?: { enabled?: boolean } }
) {
  const enabled = options?.query?.enabled ?? !!studentAddress;
  const {
    data: enrolledCourses,
    isLoading: coursesLoading,
    error: coursesError,
  } = useGetEnrolledCourses(studentAddress, { query: { enabled } });
  const { data: examCount, isLoading: examCountLoading } = useExamCounter();

  const examIds = useMemo(() => {
    if (!examCount) return [];
    return Array.from({ length: Number(examCount) }, (_, i) => BigInt(i));
  }, [examCount]);

  const isLoading = coursesLoading || examCountLoading;
  return { examIds, enrolledCourses, isLoading, error: coursesError };
}

export function useGetEnrolledCourses(
  studentAddress: `0x${string}` | undefined,
  options?: { query?: { enabled?: boolean } }
) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getEnrolledCourses",
    args: studentAddress ? [studentAddress] : undefined,
    query: { enabled: options?.query?.enabled ?? !!studentAddress },
  });
}

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
    query: { enabled: courseId !== undefined && !!studentAddress },
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
    query: { enabled: courseId !== undefined && index !== undefined },
  });
}

export function useCourses(courseId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "courses",
    args: courseId !== undefined ? [courseId] : undefined,
    query: { enabled: courseId !== undefined },
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
    query: { enabled: examId !== undefined && questionIndex !== undefined },
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
    query: { enabled: examId !== undefined && questionIndex !== undefined },
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
    query: { enabled: examId !== undefined && !!studentAddress },
  });
}

export function useExams(examId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "exams",
    args: examId !== undefined ? [examId] : undefined,
    query: { enabled: examId !== undefined },
  });
}

export function useGetCourse(courseId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getCourse",
    args: courseId !== undefined ? [courseId] : undefined,
    query: { enabled: courseId !== undefined },
  });
}

export function useGetExam(examId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getExam",
    args: examId !== undefined ? [examId] : undefined,
    query: { enabled: examId !== undefined },
  });
}

export function useGetExamQuestions(examId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getExamQuestions",
    args: examId !== undefined ? [examId] : undefined,
    query: { enabled: examId !== undefined },
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
    query: { enabled: examId !== undefined && !!studentAddress },
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
    query: { enabled: examId !== undefined && isStudent && !!address },
  });

  const transformedData = useMemo(() => {
    if (!result.data) return null;
    const data = result.data as readonly [
      readonly string[],
      readonly [string, string, string, string][],
    ];
    return { questionTexts: data[0], questionOptions: data[1] };
  }, [result.data]);

  return { ...result, data: transformedData, isStudent, userData };
}

export function useGetTutorCourses(tutorAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getTutorCourses",
    args: tutorAddress ? [tutorAddress] : undefined,
    query: { enabled: !!tutorAddress },
  });
}

export function useRegisteredUsers(userAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "registeredUsers",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });
}

export function useUsers(userAddress?: `0x${string}`) {
  // 1. Get contexts
  const { address: eoaAddress } = useAccount();
  const { smartAccountAddress } = useSmartAccountContext();

  // 2. Determine which address to fetch:
  // - Priority 1: The specific address passed as an argument (if any)
  // - Priority 2: The Smart Account Address (if connected)
  // - Priority 3: The MetaMask EOA Address (fallback)
  const addressToFetch = userAddress || smartAccountAddress || eoaAddress;

  const result = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "users",
    args: addressToFetch ? [addressToFetch] : undefined,
    query: {
      enabled: !!addressToFetch,
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
    // Optional: Return which address was actually fetched for debugging
    fetchedAddress: addressToFetch,
  };
}

// ----------------------------------------------------
// 1. UPDATED USE CREATE COURSE
// ----------------------------------------------------
export function useCreateCourse() {
  const {
    sendSessionTx, // Use the new function
    requestSession,
    hasSession,
    isPending,
    error,
    userOpHash,
    smartAccountAddress,
  } = useSmartAccountContext();

  const { data: userData } = useUsers(smartAccountAddress ?? undefined);

  const createCourse = async (title: string) => {
    // 1. If no session, ask for one!
    if (!hasSession) {
      console.log("No session found. Requesting permission...");
      await requestSession();
      // You might want to return here and force the user to click "Create" again
      // after granting, or try to proceed if state updates fast enough.
      return;
    }

    try {
      const calls = [];

      // Logic remains the same...
      if (userData && userData.isRegistered === false) {
        calls.push({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "registerUser",
          args: ["Smart Account Tutor", UserRole.TUTOR],
        });
      }

      calls.push({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "createCourse",
        args: [title],
      });

      // 2. Send via Session (No Popup)
      await sendSessionTx({ calls });

      if (userOpHash) {
        window.location.reload();
      }
    } catch (err) {
      console.error("Create Course Failed", err);
    }
  };

  return {
    createCourse,
    isPending,
    error,
    isConfirmed: !!userOpHash,
  };
}

// ----------------------------------------------------
// 2. UPDATED USE REGISTER USER
// ----------------------------------------------------
export function useRegisterUser() {
  const {
    sendSmartAccountTx,
    isPending,
    error,
    userOpHash,
    smartAccountAddress,
  } = useSmartAccountContext();

  // FIX: Fetch the Smart Account user details here!
  const { data: userData, refetch } = useUsers(
    smartAccountAddress ?? undefined
  );

  const registerUser = async (name: string, role: UserRole) => {
    // 1. FIX: Guard clause for initialization
    if (!smartAccountAddress) {
      toast.error("Smart Account is initializing... please wait 2 seconds.");
      return;
    }

    // FIX: Check registration status BEFORE sending transaction
    if (userData?.isRegistered) {
      console.log(
        "✅ Smart Account is ALREADY registered. Skipping transaction."
      );
      toast.success("Already registered!");
      return;
    }

    try {
      const txHash = await sendSmartAccountTx({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "registerUser",
        args: [name, role],
      });

      if (txHash) {
        console.log(
          "✅ Registered Smart Account Successfully! Tx Hash:",
          txHash
        );
        toast.success("Registration successful!");
        await refetch(); // Update UI immediately
      }
    } catch (err: any) {
      // Handle the error if we missed the check
      if (err.message?.includes("12416c72656164792072656769737465726564")) {
        console.warn("⚠️ Blockchain said: User already registered.");
      } else {
        console.error("❌ Failed to register user:", err);
        toast.error("Registration failed. See console.");
      }
    }
  };

  // Auto refresh
  const isConfirmed = !!userOpHash;
  useEffect(() => {
    if (isConfirmed && !isPending) {
      window.location.reload();
    }
  }, [isConfirmed, isPending]);

  return {
    registerUser,
    hash: userOpHash,
    isPending,
    isConfirming: isPending,
    isConfirmed,
    error,
    isAlreadyRegistered: userData?.isRegistered,
    // FIX: Export readiness so UI can disable button
    isReady: !!smartAccountAddress 
  };
}
// --- Other Write Hooks (Standard) ---

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
    useWaitForTransactionReceipt({ hash });
  useEffect(() => {
    if (isConfirmed) window.location.reload();
  }, [isConfirmed]);
  return { createExam, hash, isPending, isConfirming, isConfirmed, error };
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
    useWaitForTransactionReceipt({ hash });
  useEffect(() => {
    if (isConfirmed) window.location.reload();
  }, [isConfirmed]);
  return { enrollInCourse, hash, isPending, isConfirming, isConfirmed, error };
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
    useWaitForTransactionReceipt({ hash });
  useEffect(() => {
    if (isConfirmed) window.location.reload();
  }, [isConfirmed]);
  return { takeExam, hash, isPending, isConfirming, isConfirmed, error };
}
