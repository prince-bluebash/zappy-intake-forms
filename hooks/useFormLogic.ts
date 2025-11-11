import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { FormConfig, Screen, EligibilityRule } from "../types";
import { evaluateLogic, checkCondition } from "../utils/logicEvaluator";
import { performCalculations } from "../utils/calculationEngine";
import { shouldSkipScreen, DEFAULT_SKIP_STEP_RULES, SkipStepRule } from "../utils/skipSteps";

export const useFormLogic = (config: FormConfig, skipRules: SkipStepRule[] = DEFAULT_SKIP_STEP_RULES) => {
  const [currentScreenId, setCurrentScreenId] = useState<string>(
    config.screens[0].id
  );
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const answersRef = useRef<Record<string, any>>({});
  const [calculations, setCalculations] = useState<
    Record<string, number | null>
  >({});
  const [history, setHistory] = useState<string[]>([]);
  const [direction, setDirection] = useState(1);
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [maxProgress, setMaxProgress] = useState<number>(5);

    useEffect(() => {
    setCurrentScreenId(config.screens[0].id);
    // setCurrentScreenId("capture.email"??config.screens[0].id);
    setAnswers({});
    answersRef.current = {};
    setCalculations({});
    setHistory([]);
    setDirection(1);
    setReturnTo(null);
    setFlags(new Set());
    setMaxProgress(5); // Reset max progress when form resets
  }, [config]);

  const screenMap = useMemo(() => {
    const map = new Map<string, Screen>();
    config.screens.forEach((screen) => map.set(screen.id, screen));
    return map;
  }, [config.screens]);

  const currentScreen = screenMap.get(currentScreenId) as Screen;

  const updateAnswer = useCallback((id: string, value: any) => {
    setAnswers((prev) => {
      const next = { ...prev, [id]: value };
      answersRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const goToScreen = useCallback(
    (screenId: string) => {
      if (screenMap.has(screenId)) {
        setDirection(1);
        setReturnTo(currentScreenId);
        setCurrentScreenId(screenId);
      } else {
        console.warn(
          `Attempted to navigate to non-existent screen: ${screenId}`
        );
      }
    },
    [currentScreenId, screenMap]
  );

  const processEligibilityRules = useCallback(
    (
      rules: EligibilityRule[],
      currentAnswers: Record<string, any>,
      currentCalculations: Record<string, any>,
      currentFlags: Set<string>
    ): Set<string> => {
      const newFlags = new Set(currentFlags);
      for (const rule of rules) {
        // The `checkCondition` function is versatile; we can use it here.
        // We pass `null` for `currentAnswer` because these rules are global, not tied to the current screen's answer.
        if (
          checkCondition(
            rule.if,
            null,
            currentAnswers,
            currentCalculations,
            newFlags
          )
        ) {
          newFlags.add(rule.action);
        }
      }
      return newFlags;
    },
    []
  );

  const goToNext = useCallback(() => {
    setDirection(1);
    if (returnTo) {
      const returnScreenId = returnTo;
      setReturnTo(null);
      setCurrentScreenId(returnScreenId);
      return;
    }

    const latestAnswers = answersRef.current;
    const screen = screenMap.get(currentScreenId);
    if (!screen) return;

    // Perform calculations if any
    let newCalculations = calculations;
    if (screen.calculations) {
      const calculatedValues = performCalculations(
        screen.calculations,
        latestAnswers
      );
      newCalculations = { ...calculations, ...calculatedValues };
      setCalculations(newCalculations);
    }

    // Process eligibility rules and update flags
    const newFlags = processEligibilityRules(
      config.eligibility_rules,
      latestAnswers,
      newCalculations,
      flags
    );
    setFlags(newFlags);

    // Determine next screen
    let nextId: string | undefined = undefined;

    if (screen.next_logic) {
      const fieldId = (screen as any).field_id;
      const answerKey = fieldId || screen.id;
      const currentAnswer = latestAnswers[answerKey];
      nextId = evaluateLogic(
        screen.next_logic,
        currentAnswer,
        latestAnswers,
        newCalculations,
        newFlags
      );
    }

    // FIX: Removed deprecated logic that checked for `cta_primary.go_to`, which does not exist on the Cta type.
    if (!nextId && screen.next) {
      nextId = screen.next;
    }

    // Skip steps based on dynamic skip rules
    if (nextId && shouldSkipScreen(nextId, latestAnswers, skipRules)) {
      const nextScreen = screenMap.get(nextId);
      if (nextScreen && nextScreen.next) {
        // Recursively check if the next screen should also be skipped
        let currentNextId = nextScreen.next;
        const visited = new Set<string>([nextId]); // Prevent infinite loops
        
        while (currentNextId && shouldSkipScreen(currentNextId, latestAnswers, skipRules)) {
          if (visited.has(currentNextId)) {
            // Prevent infinite loop
            break;
          }
          visited.add(currentNextId);
          const skipScreen = screenMap.get(currentNextId);
          if (skipScreen && skipScreen.next) {
            currentNextId = skipScreen.next;
          } else {
            break;
          }
        }
        nextId = currentNextId;
      }
    }

    if (nextId && screenMap.has(nextId)) {
      setHistory((prev) => [...prev, currentScreenId]);
      setCurrentScreenId(nextId);
    } else {
      console.warn(`No valid next screen found for ${currentScreenId}`);
    }
  }, [
    currentScreenId,
    calculations,
    screenMap,
    returnTo,
    flags,
    config.eligibility_rules,
    processEligibilityRules,
    skipRules,
  ]);

  const goToPrev = useCallback(() => {
    setDirection(-1);
    if (returnTo) {
      const returnScreenId = returnTo;
      setReturnTo(null);
      setCurrentScreenId(returnScreenId);
      return;
    }
    if (history.length > 0) {
      const prevScreenId = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      setCurrentScreenId(prevScreenId);
    }
  }, [history, returnTo]);

  const progress = useMemo(() => {
    // If we're on a terminal screen, show 100%
    if (currentScreen?.type === "terminal") {
      const newProgress = 100;
      setMaxProgress((prev) => Math.max(prev, newProgress));
      return newProgress;
    }

    // Count actual screens visited so far (definite)
    const screensCompleted = history.length + 1;

    // Based on actual flow: typical users see around 15-20 screens due to conditional logic
    const expectedScreensToVisit = 18;

    // Use the larger of: expected 18 screens, or screens already visited + small buffer
    const totalExpectedScreens = Math.max(
      expectedScreensToVisit,
      screensCompleted + 2
    );

    // Calculate proportional progress
    const rawProgress = (screensCompleted / totalExpectedScreens) * 95; // Cap at 95% until terminal

    // Ensure minimum progress and cap at 95%
    const calculatedProgress = Math.max(5, Math.min(rawProgress, 95));

    // CRITICAL: Never allow progress to go backwards
    const finalProgress = Math.max(calculatedProgress, maxProgress);
    setMaxProgress(finalProgress);

    return finalProgress;
  }, [currentScreen, history.length, config.screens.length, maxProgress]);

  return {
    totalSteps: config.screens.length - 2,
    currentScreen,
    answers,
    calculations,
    progress,
    goToNext,
    goToPrev,
    updateAnswer,
    history,
    goToScreen,
    direction,
  };
};
