import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ScreenProps } from "./common";
import ScreenLayout from "../common/ScreenLayout";
import NavigationButtons from "../common/NavigationButtons";
import RegionDropdown from "../common/RegionDropdown";
import Select from "../ui/Select";
import Button from "../ui/Button";
import SingleSelectButtonGroup from "../common/SingleSelectButtonGroup";
import { SingleSelectScreen as SingleSelectScreenType } from "../../types";

const DROPDOWN_THRESHOLD = 15;

const SingleSelectScreen: React.FC<
  ScreenProps & { screen: SingleSelectScreenType }
> = ({
  screen,
  answers,
  updateAnswer,
  onSubmit,
  showBack,
  onBack,
  showLoginLink,
  onSignInClick,
  defaultCondition,
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
    const shouldRestrict = screen.id === "home_state" && selectedValue === "AL";

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

  const handleButtonSelect = (value: string) => {
    syncAnswer(value); // Save answer (handles both answerId and id if different)
    if (auto_advance && options.length <= DROPDOWN_THRESHOLD) {
      // Scroll to top smoothly first
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Wait for scroll animation (~300-500ms) + visual confirmation (300-600ms)
      // Total: ~600-1100ms, using 800ms as balanced middle ground
      setTimeout(() => {
        onSubmit();
      }, 800);
    }
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    syncAnswer(e.target.value);
  };

  const isComplete =
    !required || (selectedValue !== undefined && selectedValue !== "");
  const renderAsDropdown = options.length > DROPDOWN_THRESHOLD;

  if (screen.id === "home_state") {
    const stateValue = selectedValue || "";

    return (
      <ScreenLayout
        title={title}
        helpText={help_text}
        showLoginLink={showLoginLink}
      >
        {renderAsDropdown ? (
          <div className="mb-8">
            <RegionDropdown
              value={stateValue}
              onChange={(code: string) => syncAnswer(code)}
              placeholder="Select your state"
            />
          </div>
        ) : (
          <div className="mb-14">
            <SingleSelectButtonGroup
              options={options}
              selectedValue={selectedValue}
              onSelect={handleButtonSelect}
            />
          </div>
        )}

        {isStateRestricted && (
          <div
            className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-600 shadow-inner shadow-rose-100/60 mb-8"
            role="alert"
            aria-live="assertive"
          >
            Unfortunately, we are not able to service patients in Alabama.
            Redirecting you to ZappyHealth.com…
          </div>
        )}

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
        <SingleSelectButtonGroup
          options={options}
          selectedValue={selectedValue || ""}
          onSelect={handleButtonSelect}
        />
      )}

      {showNavButtons ? (
        <NavigationButtons
          showBack={showBack}
          onBack={onBack}
          onNext={onSubmit}
          isNextDisabled={!isComplete}
          onSignInClick={onSignInClick}
        />
      ) : (
        // Maintain consistent spacing for auto-advance screens
        <div className="mt-12 h-[52px]" />
      )}

      {!showNavButtons && showBackOnly && defaultCondition !== "Strength Recovery" && defaultCondition !== "Anti-Aging" && (
        <div className="w-full flex justify-start mt-10">
          <Button
            variant="ghost"
            onClick={onBack}
            aria-label="Go back to the previous question"
            className="text-[#666666] hover:text-[#00A896]"
          >
            Back
          </Button>
        </div>
      )}
    </ScreenLayout>
  );
};

export default SingleSelectScreen;
