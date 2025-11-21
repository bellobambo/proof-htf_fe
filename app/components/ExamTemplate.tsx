"use client";

import { toast } from "react-hot-toast";
import { DownloadOutlined } from "@ant-design/icons";


interface ExamTemplateProps {
  onImport: (file: File) => void;
  disabled?: boolean;
}

// Function to download TXT template
const downloadTemplate = () => {
  const templateContent = `EXAM TEMPLATE
====================

EXAM TITLE: [Enter Your Exam Title Here]

QUESTIONS:
-----------

1. [Enter your question here?]
   a) [Option 1]
   b) [Option 2]
   c) [Option 3]
   d) [Option 4]
   Correct Answer: [Enter a, b, c, or d]

2. [Another question here?]
   a) [Option 1]
   b) [Option 2]
   c) [Option 3]
   d) [Option 4]
   Correct Answer: [Enter a, b, c, or d]

INSTRUCTIONS:
-------------
1. Replace "[Enter Your Exam Title Here]" with your actual exam title
2. For each question:
   - Replace the question text inside the brackets
   - Replace all four options (a, b, c, d)
   - Specify the correct answer using a, b, c, or d
3. Add more questions by copying the question format
4. Make sure each question has exactly 4 options
5. Save the file and upload it to automatically fill the exam form

EXAMPLE:
--------
EXAM TITLE: Basic Blockchain Knowledge

QUESTIONS:
-----------

1. What is the capital of France?
   a) London
   b) Berlin
   c) Paris
   d) Madrid
   Correct Answer: c

2. Which language is used for Ethereum smart contracts?
   a) JavaScript
   b) Python
   c) Solidity
   d) Java
   Correct Answer: c
`;

  const blob = new Blob([templateContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "exam-template.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success("Template downloaded successfully! Follow the instructions in the file.");
};

// Function to parse uploaded TXT file
const parseTemplateFile = (content: string) => {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);

  let examTitle = "";
  const questions: { text: string; options: [string, string, string, string]; correctAnswer: number }[] = [];

  let currentQuestion: any = null;
  let optionIndex = 0;

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
        questions.push(currentQuestion);
      }

      currentQuestion = {
        text: questionMatch[2].trim(),
        options: ['', '', '', ''],
        correctAnswer: 0
      };
      optionIndex = 0;
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
        optionIndex++;
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
    questions.push(currentQuestion);
  }

  return { examTitle, questions };
};

export default function ExamTemplate({ onImport, disabled = false }: ExamTemplateProps) {
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const { examTitle, questions } = parseTemplateFile(content);

        if (questions.length > 0) {
          onImport(file);
          toast.success(`Successfully imported ${questions.length} questions from template!`);
        } else {
          toast.error("No valid questions found in the template. Please check the format.");
        }
      } catch (error) {
        console.error('Error parsing template:', error);
        toast.error("Error parsing template file. Please make sure it follows the correct format.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="rounded-lg border-2 p-4 ">
      <div className="flex items-center gap-2">
        <button
          onClick={downloadTemplate}
          disabled={disabled}
          className="flex-1 py-2 cursor-pointer bg-[#8B4513] text-[#F5F5DC] rounded-lg hover:bg-[#654321] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium h-[42px] text-sm whitespace-nowrap px-3 flex items-center justify-center gap-2"
        >
          <DownloadOutlined className="text-[16px]" />
          Download Template
        </button>
        <label className="flex-1">
          <input
            type="file"
            accept=".txt"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileUpload(file);
              }
              e.target.value = '';
            }}
            disabled={disabled}
            className="hidden"
          />
          <div
            className={`w-full py-2 border-2 border-[#8B4513] text-[#8B4513] rounded-lg hover:border-[#654321] hover:bg-[#8B4513] hover:text-[#F5F5DC] transition-colors text-center cursor-pointer font-medium h-[42px] flex items-center justify-center text-sm whitespace-nowrap px-3 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Upload File
          </div>
        </label>
      </div>
    </div>
  );
}