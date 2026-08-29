import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ChevronRight, HelpCircle, X } from 'lucide-react';

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  targetId?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  requireAction?: boolean;
}

const steps: TutorialStep[] = [
  {
    id: 0,
    title: "Welcome to ERP Tracker!",
    description: "I'll show you how to manage your work quickly. This short walkthrough covers the essentials.",
    position: 'center'
  },
  {
    id: 1,
    title: "Step 1: Open the Form",
    description: "First, let's create your first issue. Click the '+ New Issue' button in the top right to start.",
    targetId: 'new-issue-btn',
    position: 'bottom',
    requireAction: true
  },
  {
    id: 2,
    title: "Step 2: Create a Bug",
    description: "Fill in a title and set the Type to 'Bug'. Then click 'Create Issue' to save it.",
    targetId: 'issue-type-select',
    position: 'right',
    requireAction: true
  },
  {
    id: 3,
    title: "Step 3: Resolve it",
    description: "Now open the issue you just created (by clicking it in the list or board) and change its status to 'Done'.",
    targetId: 'issue-status-select',
    position: 'right',
    requireAction: true
  },
  {
    id: 4,
    title: "Step 4: Clean Up",
    description: "Great! Finally, let's keep things tidy. Open the issue one last time and click 'Delete' in the bottom left.",
    targetId: 'delete-issue-btn',
    position: 'left',
    requireAction: true
  },
  {
    id: 5,
    title: "You're all set!",
    description: "You've successfully created, updated, and deleted an issue. You're ready to use the system for real work!",
    position: 'center'
  }
];

interface TutorialGuideProps {
  currentStep: number;
  onNext: () => void;
  onSkip: () => void;
}

export const TutorialGuide: React.FC<TutorialGuideProps> = ({ currentStep, onNext, onSkip }) => {
  const step = steps[currentStep];
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const updateTarget = () => {
      if (step && step.targetId) {
        const el = document.getElementById(step.targetId);
        if (el) {
          setTargetRect(el.getBoundingClientRect());
        } else {
          setTargetRect(null);
        }
      } else {
        setTargetRect(null);
      }
    };

    updateTarget();
    // Re-check after 100ms in case of modal animations
    const timer = setTimeout(updateTarget, 100);
    window.addEventListener('resize', updateTarget);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateTarget);
    }
  }, [step, currentStep]);

  if (!step) return null;

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] pointer-events-none"
      />

      {targetRect && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 1,
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute border-2 border-tawny-port rounded-lg ring-[2000px] ring-slate-900/60 shadow-[0_0_0_8px_rgba(102,30,47,0.3)] z-[201]"
        />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
            ...(targetRect ? {
              top: Math.max(16, Math.min(window.innerHeight - 240 - 16, step.position === 'bottom' ? targetRect.bottom + 24 : 
                   step.position === 'top' ? targetRect.top - 240 : 
                   targetRect.top - (100))),
              left: Math.max(16, Math.min(window.innerWidth - 320 - 16, step.position === 'right' ? targetRect.right + 24 : 
                    step.position === 'left' ? targetRect.left - 344 : 
                    targetRect.left + (targetRect.width / 2) - 160))
            } : {
              top: '50%',
              left: '50%',
              marginTop: '-120px',
              marginLeft: '-160px'
            })
          }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="absolute w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-700 pointer-events-auto z-[202]"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-tawny-port/10 rounded-xl text-tawny-port">
              {currentStep === 5 ? <CheckCircle2 size={24} /> : <HelpCircle size={24} />}
            </div>
            <button 
              onClick={onSkip}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            {step.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all ${i === currentStep ? 'w-4 bg-tawny-port' : 'w-1.5 bg-slate-200 dark:bg-slate-700'}`} 
                />
              ))}
            </div>
            <button
              onClick={onNext}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg border bg-tawny-port hover:bg-tawny-port/90 text-white border-tawny-port/20"
            >
              {currentStep === 5 ? 'Start Exploring' : 'Next'}
              {currentStep !== 5 && <ChevronRight size={16} />}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
