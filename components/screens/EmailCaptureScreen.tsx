import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Check, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import NavigationButtons from "../common/NavigationButtons";
import ScreenLayout from "../common/ScreenLayout";
import { apiClient } from "../../utils/api";

interface EmailCaptureScreenProps {
  screen: {
    id: string;
    title: string;
    subtitle?: string;
    footer_note?: string;
    fields: any[];
  };
  answers: Record<string, any>;
  updateAnswer: (id: string, value: any) => void;
  onSubmit: () => void;
  showBack?: boolean;
  onBack?: () => void;
  showLoginLink?: boolean;
}

const EmailCaptureScreen: React.FC<EmailCaptureScreenProps> = ({
  screen,
  answers,
  updateAnswer,
  onSubmit,
  showBack,
  onBack,
}) => {
  const [email, setEmail] = useState(answers.email || "");
  const [firstName, setFirstName] = useState(
    answers.first_name || answers.account_firstName || ""
  );
  const [lastName, setLastName] = useState(
    answers.last_name || answers.account_lastName || ""
  );
  const [password, setPassword] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showNameFields, setShowNameFields] = useState(false);
  const [accountExists, setAccountExists] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [manualSignIn, setManualSignIn] = useState(false); // Track if user manually clicked sign in
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [createClientLoading, setCreateClientLoading] = useState(false);
  const [createClientError, setCreateClientError] = useState<string | null>(
    null
  );
  const [checkingAccount, setCheckingAccount] = useState(false);

  // Ref for password input to manage focus
  const passwordInputRef = useRef<HTMLInputElement>(null);
  // Ref for debounce timeout
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user navigated here via sign-in link from another screen
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const signInClicked = sessionStorage.getItem('zappy_sign_in_clicked');
      if (signInClicked === 'true') {
        // User clicked sign-in from another screen - set sign-in states
        setManualSignIn(true);
        setIsSigningIn(true);
        setShowPasswordField(true);
        // Clear the flag
        sessionStorage.removeItem('zappy_sign_in_clicked');
      }
    }
  }, []); // Run once on mount

  // Effect to manage password field focus
  useEffect(() => {
    // Focus password field only for sign-in flow, not for new account creation
    if (showPasswordField && passwordInputRef.current && isSigningIn) {
      setTimeout(() => passwordInputRef.current?.focus(), 100);
    }
  }, [showPasswordField, isSigningIn]);

  // Effect to debounce email validation and API check
  useEffect(() => {
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Only proceed if email is valid
    if (!isEmailValid || !email.trim()) {
      return;
    }

    // Set new timeout for debounced API call
    debounceTimeoutRef.current = setTimeout(() => {
      updateAnswer("email", email);
      if(!showPasswordField && !showNameFields) {
        checkIfAccountExists(email);
      }
    }, 1000); // 1000ms debounce delay

    // Cleanup function
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [email, isEmailValid]);

  const validateEmail = (value: string) => {
    // Stricter email validation with valid TLD check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) return false;

    // Check for valid TLD (common ones)
    const validTLDs = [
      "com",
      "org",
      "net",
      "edu",
      "gov",
      "mil",
      "co",
      "us",
      "uk",
      "ca",
      "au",
      "de",
      "fr",
      "jp",
      "cn",
      "in",
      "br",
      "io",
      "ai",
      "app",
      "dev",
    ];
    const tld = value.split(".").pop()?.toLowerCase();
    return tld ? validTLDs.includes(tld) || tld.length >= 2 : false;
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    const isValid = validateEmail(value);
    setIsEmailValid(isValid);

    // Reset states when email changes
    setAccountExists(false);
    setShowNameFields(false);
    // setShowPasswordField(false);
    // setIsSigningIn(false);
    // setManualSignIn(false);
    // API call is now handled by debounced useEffect
  };

  const checkIfAccountExists = async (emailValue: string) => {
    try {
      setCheckingAccount(true);
      const response = await apiClient.checkClientRecord(emailValue);
      const exists = response?.exists || false;
      setAccountExists(exists);

      if (!exists) {
        // New account - show name fields first, then password
        setTimeout(() => setShowNameFields(true), 300);
        setIsSigningIn(false);
        setShowPasswordField(false);
      } else {
        // Existing account detected - show sign-in mode
        setTimeout(() => {
          setShowPasswordField(true);
          setIsSigningIn(true);
        }, 300);
      }
    } catch (error: any) {
      console.error('Error checking account:', error);
      // On error, default to new account flow
      setAccountExists(false);
      setTimeout(() => setShowNameFields(true), 300);
    } finally {
      setCheckingAccount(false);
    }
  };

  const handleSignIn = async () => {
    if (password.length < 8) return;
    try {
      setSignInError(null);
      setSignInLoading(true);
      const loginResponse: any = await apiClient.login({ email, password });
      const clientRecordId = loginResponse?.client_record?.id;
      updateAnswer("email", email);
      updateAnswer("first_name", loginResponse?.client_record?.first_name);
      updateAnswer("last_name", loginResponse?.client_record?.last_name);
      updateAnswer("account_firstName", loginResponse?.client_record?.first_name);
      updateAnswer("account_lastName", loginResponse?.client_record?.last_name);
      updateAnswer("account_email", email);
      updateAnswer("account_password", password);
      updateAnswer("address", loginResponse?.client_record?.address);
      updateAnswer("mobile_phone", loginResponse?.client_record?.mobile_phone);
      if (clientRecordId) {
        updateAnswer("client_record_id", clientRecordId);
        try {
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem("client_record_id", clientRecordId);
          }
        } catch (e) {
          // Ignore storage errors
        }
      }
      onSubmit();
    } catch (error: any) {
      setSignInError(error?.message || "Failed to sign in");
    } finally {
      setSignInLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setShowForgotPassword(true);
    setForgotError(null);
    try {
      setForgotLoading(true);
      await apiClient.forgotPassword({ email });
      setResetEmailSent(true);
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetEmailSent(false);
      }, 3000);
    } catch (error: any) {
      setForgotError(error?.message || "Failed to send reset link");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = () => {
    // TODO: Implement actual password reset API call
    console.log("Sending password reset to:", email);
    setResetEmailSent(true);
    setTimeout(() => {
      setShowForgotPassword(false);
      setResetEmailSent(false);
    }, 3000);
  };

  const handleContinue = async () => {
    // If account check is still in progress, wait for it
    if (checkingAccount) {
      return;
    }

    // If we haven't determined account existence yet (shouldn't happen with auto-check, but safety check)
    if (!showPasswordField && !showNameFields) {
      if (isEmailValid) {
        await checkIfAccountExists(email);
      }
      return;
    }

    if (isSigningIn) {
      handleSignIn();
    } else {
      // New account registration
      if (password.length >= 8 && firstName.trim() && lastName.trim()) {
        updateAnswer("email", email);
        updateAnswer("first_name", firstName.trim());
        updateAnswer("last_name", lastName.trim());
        updateAnswer("password", password);
        updateAnswer("account_firstName", firstName.trim());
        updateAnswer("account_lastName", lastName.trim());
        updateAnswer("account_email", email);
        updateAnswer("account_password", password);
        setCreateClientError(null);
        try {
          setCreateClientLoading(true);
          const resp: any = await apiClient.clientRecord({
            email,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            password,
          });
          if (!resp?.short_code || resp?.short_code === "created") {
            const clientRecordId = resp?.client_record?.id;
            if (clientRecordId) {
              updateAnswer("client_record_id", clientRecordId);
              updateAnswer("address", resp?.client_record?.address);
              updateAnswer("mobile_phone", resp?.client_record?.mobile_phone);
              try {
                if (typeof window !== "undefined") {
                  window.sessionStorage.setItem(
                    "client_record_id",
                    clientRecordId
                  );
                }
              } catch { }
            }
            onSubmit();
          } else if (resp?.short_code === "already_existed") {
            setManualSignIn(true); // User manually clicked sign in
            setIsSigningIn(true);
            setShowPasswordField(true);
            // Handle as existing account
            // const loginResp: any = await apiClient.login({ email, password });
            // const loginClientId = loginResp?.client_record?.id;
            // if (loginClientId) {
            //   updateAnswer('client_record_id', loginClientId);
            //   try {
            //     if (typeof window !== 'undefined') {
            //       window.sessionStorage.setItem('client_record_id', loginClientId);
            //     }
            //   } catch {}
            // }
            // updateAnswer('email', email);
            // onSubmit();
          }
        } catch (e: any) {
          // If client record creation failed (e.g., 409 already exists), try login
          try {
            setManualSignIn(true); // User manually clicked sign in
            setIsSigningIn(true);
            setShowPasswordField(true);
            updateAnswer("email", email);
          } catch (loginErr: any) {
            setCreateClientError(
              loginErr?.message || e?.message || "Failed to create or sign in"
            );
          }
        } finally {
          setCreateClientLoading(false);
        }
      }
    }
  };

  const preCheckStage = isEmailValid && !showPasswordField && !showNameFields;
  const isComplete = isSigningIn
    ? isEmailValid && password.length >= 8
    : preCheckStage
      ? true
      : isEmailValid &&
      (password.length >= 8) &&
      (firstName.trim() && lastName.trim()) &&
      agreedToTerms;

  return (
    <ScreenLayout
      title={isSigningIn ? "Welcome back!" : screen.title}
      helpText={
        isSigningIn
          ? "Sign in to continue"
          : "We'll keep you updated on your progress and next steps"
      }
      showBack={showBack}
      onBack={onBack}
    >
      <div className="space-y-6">
        {/* Email Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="you@example.com"
              className={`w-full pl-12 pr-12 py-4 rounded-xl border-2 transition-all text-base outline-none shadow-sm ${email && !isEmailValid
                ? "border-red-300 bg-white focus:border-red-500 focus:ring-4 focus:ring-red-100"
                : "border-neutral-300 bg-white focus:border-[#00A896] focus:ring-4 focus:ring-[#00A896]/10"
                }`}
              autoFocus
            />
            {checkingAccount && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute inset-y-0 right-4 my-auto w-6 h-6 border-2 border-[#00A896] border-t-transparent rounded-full animate-spin"
              />
            )}
            {isEmailValid && !checkingAccount && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="absolute inset-y-0 right-4 my-auto w-6 h-6 rounded-full bg-[#00A896] flex items-center justify-center"
              >
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </motion.div>
            )}
          </div>
          {/* Check email now handled by NavigationButtons */}
          {email && !isEmailValid && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-600 mt-2 flex items-center gap-1"
            >
              <AlertCircle className="w-4 h-4" />
              Please enter a valid email address
            </motion.p>
          )}
        </motion.div>

        {/* Name Fields - Only for new accounts */}
        <AnimatePresence>
          {showNameFields && !isSigningIn && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full px-4 py-4 rounded-xl border-2 border-neutral-300 bg-white focus:border-[#00A896] focus:ring-4 focus:ring-[#00A896]/10 transition-all text-base outline-none shadow-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full px-4 py-4 rounded-xl border-2 border-neutral-300 bg-white focus:border-[#00A896] focus:ring-4 focus:ring-[#00A896]/10 transition-all text-base outline-none shadow-sm"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Account Exists Notice - Only show if account was detected, not if manually switching to sign-in */}
        <AnimatePresence>
          {accountExists && !showForgotPassword && !manualSignIn && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4"
            >
              <p className="text-sm text-blue-900">
                <strong>An account with this email already exists.</strong>{" "}
                Please sign in to continue.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Show password field after name fields are filled for new accounts, or immediately for sign-in */}
        <AnimatePresence>
          {((showPasswordField && isSigningIn) ||
            (showNameFields && firstName.trim() && lastName.trim())) &&
            !showForgotPassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                onAnimationComplete={() => {
                  if (!showPasswordField) setShowPasswordField(true);
                }}
              >
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  {isSigningIn ? "Password" : "Create a password"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      isSigningIn
                        ? "Enter your password"
                        : "At least 8 characters"
                    }
                    className={`w-full pl-12 pr-12 py-4 rounded-xl border-2 transition-all text-base outline-none shadow-sm ${password && password.length < 8
                      ? "border-red-300 bg-white focus:border-red-500 focus:ring-4 focus:ring-red-100"
                      : "border-neutral-300 bg-white focus:border-[#00A896] focus:ring-4 focus:ring-[#00A896]/10"
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {password && password.length < 8 && !isSigningIn && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 mt-2 flex items-center gap-1"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Password must be at least 8 characters
                  </motion.p>
                )}
                {isSigningIn && signInError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 mt-2"
                  >
                    {signInError}
                  </motion.p>
                )}
                {!isSigningIn && createClientError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 mt-2"
                  >
                    {createClientError}
                  </motion.p>
                )}

                {/* Forgot Password Link */}
                {isSigningIn && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-[#00A896] hover:text-[#008977] mt-3 font-medium"
                  >
                    Forgot password?
                  </motion.button>
                )}
              </motion.div>
            )}
        </AnimatePresence>

        {/* Password Field - OLD VERSION TO REMOVE */}
        <AnimatePresence>
          {false && showPasswordField && !showForgotPassword && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                {isSigningIn ? "Password" : "Create a password"}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    isSigningIn
                      ? "Enter your password"
                      : "At least 8 characters"
                  }
                  className={`w-full pl-12 pr-12 py-4 rounded-xl border-2 transition-all text-base outline-none shadow-sm ${password && password.length < 8
                    ? "border-red-300 bg-white focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    : "border-neutral-300 bg-white focus:border-[#00A896] focus:ring-4 focus:ring-[#00A896]/10"
                    }`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {password && password.length < 8 && !isSigningIn && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 mt-2 flex items-center gap-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  Password must be at least 8 characters
                </motion.p>
              )}

              {/* Forgot Password Link */}
              {isSigningIn && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-[#00A896] hover:text-[#008977] mt-3 font-medium"
                >
                  Forgot password?
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Forgot Password Flow */}
        <AnimatePresence>
          {showForgotPassword && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white border-2 border-neutral-200 rounded-xl p-6"
            >
              {!resetEmailSent ? (
                <>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    Reset your password
                  </h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    We'll send a password reset link to <strong>{email}</strong>
                  </p>
                  {forgotError && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-600 mb-3"
                    >
                      {forgotError}
                    </motion.p>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={handleResetPassword}
                      disabled={forgotLoading}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${forgotLoading
                        ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                        : "bg-[#00A896] text-white hover:bg-[#008977]"
                        }`}
                    >
                      {forgotLoading ? "Sending…" : "Send reset link"}
                    </button>
                    <button
                      onClick={() => setShowForgotPassword(false)}
                      className="px-4 py-3 border-2 border-neutral-300 text-neutral-700 rounded-xl font-medium hover:bg-neutral-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    Check your email
                  </h3>
                  <p className="text-sm text-neutral-600">
                    We've sent a password reset link to {email}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Consent Checkbox - Only show for new accounts, not for sign-in */}
        <AnimatePresence>
          {showPasswordField && !isSigningIn && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <label className="flex items-start gap-2.5 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="absolute opacity-0 w-4 h-4 cursor-pointer z-10 peer"
                  />
                  <motion.div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-[#00A896] peer-focus-visible:ring-offset-2 ${agreedToTerms
                      ? "border-[#00A896] bg-[#00A896] shadow-md shadow-[#00A896]/30"
                      : "border-[#E8E8E8] bg-white group-hover:border-[#00A896]/50 group-hover:shadow-sm"
                      }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <AnimatePresence>
                      {agreedToTerms && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180, opacity: 0 }}
                          animate={{ scale: 1, rotate: 0, opacity: 1 }}
                          exit={{ scale: 0, rotate: 180, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        >
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  {agreedToTerms && (
                    <motion.div
                      className="absolute inset-0 rounded border-2 border-[#00A896] opacity-0 pointer-events-none ring-2 ring-[#00A896]/20"
                      animate={{ opacity: [0, 0.3, 0], scale: [1, 1.3, 1.5] }}
                      transition={{ duration: 0.4 }}
                    />
                  )}
                </div>
                <span className="text-xs leading-relaxed text-neutral-600 group-hover:text-neutral-700 transition-colors">
                  I agree to the{" "}
                  <a
                    href="https://zappyhealth.com/termsofservice"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00A896] hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Terms
                  </a>
                  {" "}and{" "}
                  <a
                    href="https://zappyhealth.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00A896] hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Privacy Policy
                  </a>
                </span>
              </label>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Already have account link - Only show for new account flow */}
        {!isSigningIn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <button
              onClick={() => {
                setManualSignIn(true); // User manually clicked sign in
                setIsSigningIn(true);
                setShowPasswordField(true);
              }}
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Already have an account?{" "}
              <span className="text-[#00A896] font-medium">Sign in</span>
            </button>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="mt-8">
          <NavigationButtons
            showBack={showBack}
            onBack={onBack}
            onNext={handleContinue}
            isNextDisabled={!isComplete}
            isNextLoading={
              checkingAccount ||
              (isSigningIn && signInLoading) ||
              (!isSigningIn && createClientLoading)
            }
            nextLabel={
              isSigningIn
                ? "Sign in"
                : "Continue"
            }
          />
        </div>

        {/* Privacy Notice at Very Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-neutral-500 text-center leading-relaxed mt-6"
        >
          <Lock className="w-3.5 h-3.5 inline-block mr-1 text-[#00A896]" />
          <strong className="text-neutral-600">Your Privacy:</strong> Your
          health information is protected under HIPAA. We use secure storage and
          encryption.
        </motion.div>
      </div>
    </ScreenLayout>
  );
};

export default EmailCaptureScreen;
