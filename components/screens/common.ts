
import { Screen } from '../../types';

export interface ScreenProps {
  screen: Screen;
  answers: Record<string, any>;
  updateAnswer: (id: string, value: any) => void;
  onSubmit: (payload?: any) => void;
  showBack: boolean;
  onBack: () => void;
  headerSize?: string;
  calculations?: Record<string, any>;
  defaultCondition?: string;
  showLoginLink?: boolean;
  onSignInClick?: () => void; // Handler for sign-in link
}
