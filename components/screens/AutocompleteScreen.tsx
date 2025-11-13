import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ScreenProps } from "./common";
import ScreenLayout from "../common/ScreenLayout";
import NavigationButtons from "../common/NavigationButtons";
import RegionDropdown from "../common/RegionDropdown";
import Select from "../ui/Select";
import Button from "../ui/Button";
import { AutocompleteScreen as AutocompleteScreenType } from "../../types";

const DROPDOWN_THRESHOLD = 15;

const AutocompleteScreen: React.FC<
  ScreenProps & { screen: AutocompleteScreenType }
> = ({
  screen,
  answers,
  updateAnswer,
  onSubmit,
  showBack,
  onBack,
  showLoginLink,
  onSignInClick,
}) => {
  const {
    id,
    title,
    help_text,
    options = [],
    required,
    auto_advance = true,
    field_id,
  } = screen;
  // Use field_id if provided, otherwise use id
  const answerId = field_id || id;
  const selectedValue = answers[answerId];
  const [isStateRestricted, setIsStateRestricted] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const redirectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setHasAnimated(true);
  }, []);

  useEffect(() => {
    const shouldRestrict =
      (screen.id === "home_state") && selectedValue === "AL";

    setIsStateRestricted((prev) =>
      prev === shouldRestrict ? prev : shouldRestrict
    );

    if (redirectTimerRef.current) {
      window.clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }

    if (shouldRestrict) {
      redirectTimerRef.current = window.setTimeout(() => {
        window.location.href = "https://zappyhealth.com";
      }, 3000);
    }

    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, [screen.id, selectedValue]);

  const syncAnswer = (value: string) => {
    updateAnswer(answerId, value);
    if (answerId !== id) {
      updateAnswer(id, value);
    }
  };

  if (screen.id === "home_state") {
    const stateValue = selectedValue || "";
    const handleStateChange = (code: string) => {
      syncAnswer(code);
    };

    return (
      <ScreenLayout
        title={title}
        helpText={help_text}
        showLoginLink={showLoginLink}
      >
        <div className="space-y-4">
          <RegionDropdown
            value={stateValue}
            onChange={handleStateChange}
            placeholder="Select your state"
          />
          {isStateRestricted && (
            <div
              className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-600 shadow-inner shadow-rose-100/60"
              role="alert"
              aria-live="assertive"
            >
              Unfortunately, we are not able to service patients in Alabama.
              Redirecting you to ZappyHealth.com…
            </div>
          )}
        </div>
        <NavigationButtons
          showBack={showBack}
          onBack={onBack}
          onNext={onSubmit}
          isNextDisabled={!stateValue || isStateRestricted}
          onSignInClick={onSignInClick}
        />
      </ScreenLayout>
    );
  }

  const handleButtonSelect = (value: string) => {
    syncAnswer(value);
    if (auto_advance) {
      // Auto-submit with reasonable delay to allow user confirmation
      setTimeout(onSubmit, 600);
    }
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    syncAnswer(e.target.value);
  };

  const isComplete =
    !required || (selectedValue !== undefined && selectedValue !== "");

  const renderAsDropdown = options.length > DROPDOWN_THRESHOLD;

  // For dropdowns, we never auto_advance and always show nav buttons.
  const showNavButtons = !auto_advance || renderAsDropdown;
  const showBackOnly = auto_advance && !renderAsDropdown && showBack;

  return (
    <ScreenLayout
      title={title}
      helpText={help_text}
      showLoginLink={showLoginLink}
    >
      {renderAsDropdown ? (
        <Select
          id={answerId}
          options={options}
          value={selectedValue || ""}
          onChange={handleDropdownChange}
          required={required}
        />
      ) : (
        <div className="space-y-3 mb-14">
          {options.map((option, index) => {
            const isSelected = selectedValue === option.value;
            const reducedMotion = window.matchMedia(
              "(prefers-reduced-motion: reduce)"
            ).matches;

            return (
              <motion.button
                key={option.value}
                onClick={() => handleButtonSelect(option.value)}
                initial={
                  hasAnimated || reducedMotion ? false : { opacity: 0, x: 20 }
                }
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: isSelected ? 0.98 : 1,
                }}
                whileHover={
                  reducedMotion
                    ? {}
                    : {
                        scale: isSelected ? 0.98 : 1.01,
                      }
                }
                whileTap={
                  reducedMotion
                    ? {}
                    : {
                        scale: 0.97,
                      }
                }
                transition={
                  reducedMotion
                    ? { duration: 0.01 }
                    : {
                        duration: 0.45,
                        ease: [0.25, 0.1, 0.25, 1],
                        delay: hasAnimated ? 0 : index * 0.1,
                      }
                }
                className={`w-full flex items-center justify-between p-5 border-2 rounded-xl text-base focus:outline-none transition-colors duration-200 ${
                  isSelected
                    ? "border-primary bg-primary/5 text-primary"
                    : "bg-white border-gray-200 hover:border-primary/30 hover:bg-gray-50 text-neutral-600"
                }`}
                style={{
                  transitionDuration: "var(--timing-normal)",
                  transitionTimingFunction: "var(--easing-elegant)",
                }}
              >
                <span className="text-left flex-1">{option.label}</span>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    isSelected ? "bg-primary" : "border-2 border-gray-300"
                  }`}
                  style={{
                    transitionDuration: "var(--timing-normal)",
                    transitionTimingFunction: "var(--easing-elegant)",
                  }}
                >
                  {isSelected && (
                    <motion.svg
                      initial={
                        reducedMotion
                          ? { opacity: 1 }
                          : { pathLength: 0, opacity: 0 }
                      }
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={
                        reducedMotion
                          ? { duration: 0.01 }
                          : {
                              pathLength: {
                                type: "spring",
                                stiffness: 180,
                                damping: 25,
                              },
                              opacity: { duration: 0.25 },
                            }
                      }
                      className="w-4 h-4 text-white"
                      fill="none"
                      strokeWidth="3"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <motion.path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </motion.svg>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {showNavButtons && (
        <NavigationButtons
          showBack={showBack}
          onBack={onBack}
          onNext={onSubmit}
          isNextDisabled={!isComplete}
        />
      )}

      {!showNavButtons && showBackOnly && (
        <div className="w-full flex justify-start mt-10">
          <Button
            variant="ghost"
            onClick={onBack}
            aria-label="Go back to the previous question"
          >
            Back
          </Button>
        </div>
      )}
    </ScreenLayout>
  );
};

export default AutocompleteScreen;
