import { useState } from 'react';
import { useOnboardingWizardStore } from '../store';
import { wizardQuestions, type WizardStepId } from '../data';
import { WelcomeScreen } from './WelcomeScreen';
import { QuestionScreen } from './QuestionScreen';
import { TransitionScreen } from './TransitionScreen';

type Phase = 'welcome' | 'questions' | 'transition';

export function WelcomePage() {
  const [phase, setPhase] = useState<Phase>('welcome');
  const [stepIndex, setStepIndex] = useState(0);
  const answers = useOnboardingWizardStore((s) => s.answers);
  const setAnswer = useOnboardingWizardStore((s) => s.setAnswer);

  if (phase === 'welcome') {
    return <WelcomeScreen onStart={() => setPhase('questions')} />;
  }

  if (phase === 'transition') {
    return <TransitionScreen />;
  }

  const question = wizardQuestions[stepIndex];
  const stepId = question.id as WizardStepId;
  const selected = answers[stepId] ?? [];

  return (
    <QuestionScreen
      question={question}
      selectedValues={selected}
      onSelect={(values) => setAnswer(stepId, values)}
      onNext={() => {
        if (stepIndex < wizardQuestions.length - 1) {
          setStepIndex(stepIndex + 1);
        } else {
          setPhase('transition');
        }
      }}
      onBack={stepIndex > 0 ? () => setStepIndex(stepIndex - 1) : undefined}
      stepIndex={stepIndex}
      totalSteps={wizardQuestions.length}
    />
  );
}
