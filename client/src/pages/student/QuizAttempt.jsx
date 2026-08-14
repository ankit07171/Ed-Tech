import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ShieldAlert, Maximize } from "lucide-react";
import axios from "../../utils/axiosConfig.js";

const MAX_VIOLATIONS = 3; // auto-submit after this many proctoring violations

export default function AttemptQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const startTimeRef = useRef(Date.now());
  const submittedRef = useRef(false);

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [locked, setLocked] = useState(true); // must enter fullscreen before attempting
  const [violations, setViolations] = useState(0);
  const [warning, setWarning] = useState("");
  const proctorRef = useRef({ tabSwitches: 0, fullscreenExits: 0, blurCount: 0 });

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await axios.get(`/api/quizzes/one/${quizId}`, { withCredentials: true });
        if (res.data && res.data.questions) {
          setQuiz(res.data);
          setAnswers(new Array(res.data.questions.length).fill(""));
        } else {
          toast.error("Quiz not found");
        }
      } catch (err) {
        if (err?.response?.status === 409) {
          toast.info("You've already attempted this quiz.");
          navigate(`/student/quiz/review/${quizId}`);
          return;
        }
        toast.error("Something went wrong loading the quiz");
      }
    };
    fetchQuiz();
  }, [quizId, navigate]);

  const handleSubmit = useCallback(async (auto = false) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const timeSpentInSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);

    try {
      const res = await axios.post(
        "/api/quizzes/submit",
        {
          quizId,
          answers,
          timeSpentInSeconds,
          proctoring: { ...proctorRef.current, autoSubmitted: auto },
        },
        { withCredentials: true }
      );
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      toast[auto ? "warning" : "success"](
        auto ? "Quiz auto-submitted due to proctoring violations." : "Quiz submitted!"
      );
      navigate(`/student/quiz/review/${quizId}`);
    } catch (error) {
      if (error?.response?.status === 409) {
        toast.info("This quiz was already submitted.");
        navigate(`/student/quiz/review/${quizId}`);
        return;
      }
      submittedRef.current = false;
      toast.error("Submission failed");
    }
  }, [answers, quizId, navigate]);

  // ---- Proctoring: fullscreen requirement ----
  const enterFullscreenAndStart = async () => {
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      // Some browsers/devices (iOS Safari) don't support the Fullscreen API —
      // don't block the student entirely, just proceed without it.
    }
    setLocked(false);
  };

  const registerViolation = useCallback((message) => {
    setViolations((prev) => {
      const next = prev + 1;
      setWarning(`${message} — warning ${next}/${MAX_VIOLATIONS}.`);
      if (next >= MAX_VIOLATIONS) {
        handleSubmit(true);
      }
      return next;
    });
  }, [handleSubmit]);

  // ---- Proctoring: watch fullscreen exit, tab switches, window blur ----
  useEffect(() => {
    if (locked || submittedRef.current) return;

    const onFullscreenChange = () => {
      if (!document.fullscreenElement && !submittedRef.current) {
        proctorRef.current.fullscreenExits += 1;
        registerViolation("You exited full-screen mode");
      }
    };
    const onVisibilityChange = () => {
      if (document.hidden && !submittedRef.current) {
        proctorRef.current.tabSwitches += 1;
        registerViolation("You switched tabs/windows");
      }
    };
    const onBlur = () => {
      if (!submittedRef.current) {
        proctorRef.current.blurCount += 1;
      }
    };
    const blockContextMenu = (e) => e.preventDefault();
    const blockCopyPaste = (e) => e.preventDefault();
    const blockShortcuts = (e) => {
      // Block common cheat/inspect shortcuts during the quiz.
      const key = e.key?.toLowerCase();
      if (
        e.key === "F12" ||
        (e.ctrlKey && ["c", "v", "u", "s", "p"].includes(key)) ||
        (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(key))
      ) {
        e.preventDefault();
      }
    };
    const onBeforeUnload = (e) => {
      if (!submittedRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    document.addEventListener("contextmenu", blockContextMenu);
    document.addEventListener("copy", blockCopyPaste);
    document.addEventListener("paste", blockCopyPaste);
    document.addEventListener("keydown", blockShortcuts);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("contextmenu", blockContextMenu);
      document.removeEventListener("copy", blockCopyPaste);
      document.removeEventListener("paste", blockCopyPaste);
      document.removeEventListener("keydown", blockShortcuts);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [locked, registerViolation]);

  // Clean up fullscreen if the component unmounts mid-quiz
  useEffect(() => {
    return () => {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, []);

  if (!quiz) return <p className="text-center mt-10 dark:text-gray-300">Loading quiz...</p>;

  if (locked) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 bg-white dark:bg-gray-800 rounded-xl shadow text-center space-y-4">
        <ShieldAlert className="mx-auto text-purple-600 dark:text-purple-300" size={32} />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{quiz.title}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          This quiz is proctored. It will run in full-screen mode. Switching tabs, exiting
          full-screen, or using copy/paste shortcuts will count as a violation — after{" "}
          {MAX_VIOLATIONS} violations your quiz is auto-submitted.
        </p>
        <button
          onClick={enterFullscreenAndStart}
          className="inline-flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-semibold transition"
        >
          <Maximize size={16} /> Enter Full-Screen &amp; Start
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-900 min-h-screen select-none">
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-white dark:bg-gray-900 py-2 z-10">
        <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-300">{quiz.title}</h2>
        <span className="text-xs px-2 py-1 rounded bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-300 font-medium">
          Proctored · {violations}/{MAX_VIOLATIONS} warnings
        </span>
      </div>

      {warning && (
        <div className="mb-4 text-sm px-3 py-2 rounded bg-amber-50 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300">
          {warning}
        </div>
      )}

      {quiz.questions.map((q, i) => (
        <div key={i} className="mb-6">
          <p className="mb-2 font-medium text-gray-800 dark:text-gray-100">
            {i + 1}. {q.question}
          </p>
          {q.options.map((opt, j) => (
            <label key={j} className="block mb-1 text-gray-700 dark:text-gray-200">
              <input
                type="radio"
                name={`q${i}`}
                value={opt}
                checked={answers[i] === opt}
                onChange={() => {
                  const updated = [...answers];
                  updated[i] = opt;
                  setAnswers(updated);
                }}
                className="mr-2"
              />
              {opt}
            </label>
          ))}
        </div>
      ))}

      <button
        onClick={() => handleSubmit(false)}
        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition"
      >
        Submit Quiz
      </button>
    </div>
  );
}
