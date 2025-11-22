import { useEffect } from "react";
import { Drawer, Spin } from "antd";
import {
    useGetPastExamForRevision,
    useUsers,
    UserRole
} from "@/utils/useContractHooks";
import { useAccount } from "wagmi";


interface PastExamQuestionsProps {
    examTitle: string;
    examId: bigint | undefined;
    isVisible: boolean;
    onClose: () => void;
}

export function PastExamQuestions({
    examTitle,
    examId,
    isVisible,
    onClose
}: PastExamQuestionsProps) {
    const {
        data: pastExamData,
        isLoading,
        error,
        refetch
    } = useGetPastExamForRevision(examId);

    const { address } = useAccount();
    const { data: userData } = useUsers(address);

    // Refetch when the drawer becomes visible
    useEffect(() => {
        if (isVisible && examId) {
            console.log("🔄 Fetching minimal past exam data for ID:", examId.toString());
            refetch();
        }
    }, [isVisible, examId, refetch]);

    // Enhanced debugging
    useEffect(() => {
        console.group("🔍 PastExamQuestions Component Debug");
        console.log("Exam Title:", examTitle);
        console.log("Exam ID:", examId?.toString());
        console.log("Drawer Visible:", isVisible);
        console.log("Past Exam Data:", pastExamData);
        console.log("Loading:", isLoading);
        console.log("Error:", error);
        console.log("User Data:", userData);
        console.groupEnd();
    }, [examTitle, examId, pastExamData, isVisible, isLoading, error, userData]);


    // Since we don't have score data, we'll show 0
    const calculateScore = () => {
        return 0;
    };

    // Show loading state
    if (isLoading) {
        return (
            <Drawer
                title={<span className="text-[#5D4037] text-xl font-bold">Exam Review: {examTitle}</span>}
                placement="right"
                onClose={onClose}
                open={isVisible}
                width={900}
                closeIcon={<div className="text-[#8B4513] hover:text-[#654321] transition-colors">✕</div>}
                styles={{
                    body: { backgroundColor: "#F5F5DC" },
                    header: { backgroundColor: "#F5F5DC" },
                    content: { backgroundColor: "#F5F5DC" }
                }}
            >
                <div className="flex flex-col items-center justify-center h-64">
                    <Spin size="large" />
                    <div className="mt-4 text-[#8B4513] text-lg">Loading exam questions...</div>
                </div>
            </Drawer>
        );
    }

    // Show error state
    if (error) {
        console.error("❌ Error loading past exam:", error);
        return (
            <Drawer
                title={<span className="text-[#5D4037] text-xl font-bold">Exam Review: {examTitle}</span>}
                placement="right"
                onClose={onClose}
                open={isVisible}
                width={1500}
                closeIcon={<div className="text-[#8B4513] hover:text-[#654321] transition-colors">✕</div>}
                styles={{
                    body: { backgroundColor: "#F5F5DC" },
                    header: { backgroundColor: "#F5F5DC" },
                    content: { backgroundColor: "#F5F5DC" }
                }}
            >
                <div className="flex flex-col items-center justify-center h-64">
                    <div className="text-[#8B4513] text-lg mb-4">Error loading exam data</div>
                    <div className="text-sm text-[#6D4C41] mb-4 p-4 bg-[#FFEBEE] rounded-lg">
                        {error.message}
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-[#8B4513] text-[#F5F5DC] rounded-lg hover:bg-[#6D4C41] transition-colors"
                    >
                        Close
                    </button>
                </div>
            </Drawer>
        );
    }

    // Show no data state
    if (!pastExamData || !pastExamData.questionTexts || !pastExamData.questionOptions) {
        return (
            <Drawer
                title={<span className="text-[#5D4037] text-xl font-bold">Exam Review: {examTitle}</span>}
                placement="right"
                onClose={onClose}
                open={isVisible}
                width={1500}
                closeIcon={<div className="text-[#8B4513] hover:text-[#654321] transition-colors">✕</div>}
                styles={{
                    body: { backgroundColor: "#F5F5DC" },
                    header: { backgroundColor: "#F5F5DC" },
                    content: { backgroundColor: "#F5F5DC" }
                }}
            >
                <div className="flex flex-col items-center justify-center h-64">
                    <div className="text-[#8B4513] text-lg mb-4">No exam data available for revision</div>
                    <p className="text-[#6D4C41] text-sm mb-4">
                        Complete the exam first to view the questions and your answers.
                    </p>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-[#8B4513] text-[#F5F5DC] rounded-lg hover:bg-[#6D4C41] transition-colors"
                    >
                        Close
                    </button>
                </div>
            </Drawer>
        );
    }


    return (
        <Drawer
            title={<span className="text-[#5D4037] text-xl font-bold">Exam Review: {examTitle}</span>}
            placement="right"
            onClose={onClose}
            open={isVisible}
            width={800}
            closeIcon={<div className="text-[#8B4513] hover:text-[#654321] transition-colors">✕</div>}
            maskClosable={false}
            styles={{
                body: { backgroundColor: "#F5F5DC" },
                header: { backgroundColor: "#F5F5DC" },
                content: { backgroundColor: "#F5F5DC" }
            }}
        >
            <div className="space-y-6">
                {/* Information Notice - Added to top */}
                {/* Information Notice - Added to top */}
                <div className="bg-[#FFF8E1] border-2 border-[#8D6E63] rounded-lg p-4">
                    <div className="flex items-start">
                        <div className="text-[#8B4513] text-lg mr-3">💡</div>
                        <div>
                            <h4 className="font-bold text-[#5D4037] mb-1">Questions Review Mode</h4>
                            <p className="text-[#6D4C41] text-sm">
                                This review shows the exam questions and options only.
                                Complete the exam to view your answers, score, and detailed feedback.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Exam Summary - Simplified since we don't have score data */}
                <div className="bg-[#FFF8E1]  flex justify-between border-2 border-[#8D6E63] rounded-lg p-6">
                    <span className="text-xl font-semibold text-[#5D4037] mb-4">
                        Exam Questions Review
                    </span>

                    <span className="text-[#8B4513] ml-2 text-[16px]">Questions ({pastExamData.questionTexts.length})</span>
                </div>

                {/* Questions Review - Show questions and options only */}
                {pastExamData.questionTexts.map((question, index) => {
                    const options = pastExamData.questionOptions[index] || ["", "", "", ""];

                    return (
                        <div
                            key={index}
                            className="border-2 border-[#8D6E63] rounded-xl p-6 bg-white shadow-md"
                        >
                            {/* Question Header */}
                            <div className="flex items-start justify-between mb-4">
                                <h4 className="font-bold text-[#5D4037] text-lg flex-1">
                                    Question {index + 1}: {question}
                                </h4>
                            </div>

                            {/* Options */}
                            <div className="space-y-3">
                                {options.map((option, optIndex) => {
                                    const optionLetters = ["A", "B", "C", "D"];
                                    const optionLetter = optionLetters[optIndex];

                                    return (
                                        <div
                                            key={optIndex}
                                            className="flex items-center p-4 rounded-lg border-2 border-[#D7CCC8] bg-white transition-all"
                                        >
                                            <div
                                                className="flex items-center justify-center w-10 h-10 rounded-full border-2 mr-4 flex-shrink-0 font-bold text-lg border-[#8D6E63] text-[#5D4037] bg-white"
                                            >
                                                {optionLetter}
                                            </div>
                                            <span className="text-[#5D4037] text-base flex-1 font-medium">
                                                {option}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Information Notice */}
                            <div className="mt-4 p-4 bg-[#FFF8E1] rounded-lg border border-[#8D6E63]">
                                <p className="text-[#5D4037] font-medium">
                                    This review shows the exam questions. Complete the exam to see your answers and score.
                                </p>
                            </div>
                        </div>
                    );
                })}

                {/* Close Button */}
                <div className="bg-[#F5F5DC] pt-4 pb-2">
                    <button
                        onClick={onClose}
                        className="w-full py-4 px-6 bg-[#8B4513] hover:bg-[#6D4C41] text-[#F5F5DC] rounded-lg font-bold transition-colors text-lg shadow-lg"
                    >
                        Close Review
                    </button>
                </div>
            </div>
        </Drawer>
    );
}