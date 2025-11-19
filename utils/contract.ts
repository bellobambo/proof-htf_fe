export const CONTRACT_ADDRESS ="0x179BF34155cD129FeB3b2440f50418C4836e65D6" as `0x${string}`;


export const CONTRACT_ABI = [

      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "courseId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "string",
            name: "title",
            type: "string",
          },
          {
            indexed: true,
            internalType: "address",
            name: "tutor",
            type: "address",
          },
        ],
        name: "CourseCreated",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "student",
            type: "address",
          },
          {
            indexed: true,
            internalType: "uint256",
            name: "courseId",
            type: "uint256",
          },
        ],
        name: "EnrollmentCreated",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "examId",
            type: "uint256",
          },
          {
            indexed: true,
            internalType: "address",
            name: "student",
            type: "address",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "score",
            type: "uint256",
          },
        ],
        name: "ExamCompleted",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "examId",
            type: "uint256",
          },
          {
            indexed: true,
            internalType: "uint256",
            name: "courseId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "string",
            name: "title",
            type: "string",
          },
        ],
        name: "ExamCreated",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "user",
            type: "address",
          },
          {
            indexed: false,
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            indexed: false,
            internalType: "enum ProofHTF.Role",
            name: "role",
            type: "uint8",
          },
        ],
        name: "UserRegistered",
        type: "event",
      },
      {
        inputs: [],
        name: "courseCounter",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "",
            type: "address",
          },
        ],
        name: "courseEnrollments",
        outputs: [
          {
            internalType: "bool",
            name: "",
            type: "bool",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        name: "courseExams",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        name: "courses",
        outputs: [
          {
            internalType: "uint256",
            name: "courseId",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "title",
            type: "string",
          },
          {
            internalType: "address",
            name: "tutor",
            type: "address",
          },
          {
            internalType: "string",
            name: "tutorName",
            type: "string",
          },
          {
            internalType: "bool",
            name: "isActive",
            type: "bool",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "string",
            name: "title",
            type: "string",
          },
        ],
        name: "createCourse",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "courseId",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "title",
            type: "string",
          },
          {
            internalType: "string[]",
            name: "questionTexts",
            type: "string[]",
          },
          {
            internalType: "string[4][]",
            name: "questionOptions",
            type: "string[4][]",
          },
          {
            internalType: "uint256[]",
            name: "correctAnswers",
            type: "uint256[]",
          },
        ],
        name: "createExam",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "courseId",
            type: "uint256",
          },
        ],
        name: "enrollInCourse",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        name: "examCorrectAnswers",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "examCounter",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        name: "examOptions",
        outputs: [
          {
            internalType: "string",
            name: "",
            type: "string",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        name: "examQuestions",
        outputs: [
          {
            internalType: "string",
            name: "",
            type: "string",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "",
            type: "address",
          },
        ],
        name: "examSessions",
        outputs: [
          {
            internalType: "uint256",
            name: "examId",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "student",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "score",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "isCompleted",
            type: "bool",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        name: "exams",
        outputs: [
          {
            internalType: "uint256",
            name: "examId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "courseId",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "title",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "questionCount",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "isActive",
            type: "bool",
          },
          {
            internalType: "address",
            name: "creator",
            type: "address",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "courseId",
            type: "uint256",
          },
        ],
        name: "getCourse",
        outputs: [
          {
            components: [
              {
                internalType: "uint256",
                name: "courseId",
                type: "uint256",
              },
              {
                internalType: "string",
                name: "title",
                type: "string",
              },
              {
                internalType: "address",
                name: "tutor",
                type: "address",
              },
              {
                internalType: "string",
                name: "tutorName",
                type: "string",
              },
              {
                internalType: "bool",
                name: "isActive",
                type: "bool",
              },
            ],
            internalType: "struct ProofHTF.Course",
            name: "",
            type: "tuple",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "student",
            type: "address",
          },
        ],
        name: "getEnrolledCourses",
        outputs: [
          {
            components: [
              {
                internalType: "uint256",
                name: "courseId",
                type: "uint256",
              },
              {
                internalType: "string",
                name: "title",
                type: "string",
              },
              {
                internalType: "address",
                name: "tutor",
                type: "address",
              },
              {
                internalType: "string",
                name: "tutorName",
                type: "string",
              },
              {
                internalType: "bool",
                name: "isActive",
                type: "bool",
              },
            ],
            internalType: "struct ProofHTF.Course[]",
            name: "",
            type: "tuple[]",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "examId",
            type: "uint256",
          },
        ],
        name: "getExam",
        outputs: [
          {
            components: [
              {
                internalType: "uint256",
                name: "examId",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "courseId",
                type: "uint256",
              },
              {
                internalType: "string",
                name: "title",
                type: "string",
              },
              {
                internalType: "uint256",
                name: "questionCount",
                type: "uint256",
              },
              {
                internalType: "bool",
                name: "isActive",
                type: "bool",
              },
              {
                internalType: "address",
                name: "creator",
                type: "address",
              },
            ],
            internalType: "struct ProofHTF.Exam",
            name: "",
            type: "tuple",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "examId",
            type: "uint256",
          },
        ],
        name: "getExamQuestions",
        outputs: [
          {
            internalType: "string[]",
            name: "questionTexts",
            type: "string[]",
          },
          {
            internalType: "string[4][]",
            name: "questionOptions",
            type: "string[4][]",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "examId",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "student",
            type: "address",
          },
        ],
        name: "getExamResults",
        outputs: [
          {
            internalType: "uint256",
            name: "rawScore",
            type: "uint256",
          },
          {
            internalType: "uint256[]",
            name: "answers",
            type: "uint256[]",
          },
          {
            internalType: "bool",
            name: "isCompleted",
            type: "bool",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "examId",
            type: "uint256",
          },
        ],
        name: "getPastExamForRevision",
        outputs: [
          {
            internalType: "string[]",
            name: "questionTexts",
            type: "string[]",
          },
          {
            internalType: "string[4][]",
            name: "questionOptions",
            type: "string[4][]",
          },
          {
            internalType: "uint256[]",
            name: "correctAnswers",
            type: "uint256[]",
          },
          {
            internalType: "uint256[]",
            name: "studentAnswers",
            type: "uint256[]",
          },
          {
            internalType: "bool[]",
            name: "isCorrect",
            type: "bool[]",
          },
          {
            internalType: "uint256",
            name: "studentScore",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxScore",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "tutor",
            type: "address",
          },
        ],
        name: "getTutorCourses",
        outputs: [
          {
            components: [
              {
                internalType: "uint256",
                name: "courseId",
                type: "uint256",
              },
              {
                internalType: "string",
                name: "title",
                type: "string",
              },
              {
                internalType: "address",
                name: "tutor",
                type: "address",
              },
              {
                internalType: "string",
                name: "tutorName",
                type: "string",
              },
              {
                internalType: "bool",
                name: "isActive",
                type: "bool",
              },
            ],
            internalType: "struct ProofHTF.Course[]",
            name: "",
            type: "tuple[]",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "enum ProofHTF.Role",
            name: "role",
            type: "uint8",
          },
        ],
        name: "registerUser",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "",
            type: "address",
          },
        ],
        name: "registeredUsers",
        outputs: [
          {
            internalType: "bool",
            name: "",
            type: "bool",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "examId",
            type: "uint256",
          },
          {
            internalType: "uint256[]",
            name: "answers",
            type: "uint256[]",
          },
        ],
        name: "takeExam",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "",
            type: "address",
          },
        ],
        name: "users",
        outputs: [
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "enum ProofHTF.Role",
            name: "role",
            type: "uint8",
          },
          {
            internalType: "bool",
            name: "isRegistered",
            type: "bool",
          },
        ],
        stateMutability: "view",
        type: "function",
      }
] as const;
