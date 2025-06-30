import React, { useEffect, useState } from 'react';
import { elevenLabsService } from '../lib/elevenLabsService';
import VoiceCommandListener from './VoiceCommandListener';

interface VoiceCommandHandlerProps {
  onCreateTask: () => void;
  onBrowseTasks: () => void;
  onOpenWallet: () => void;
  onOpenProfile: () => void;
  onOpenHelp: () => void;
  onOpenSafety: () => void;
}

const VoiceCommandHandler: React.FC<VoiceCommandHandlerProps> = ({
  onCreateTask,
  onBrowseTasks,
  onOpenWallet,
  onOpenProfile,
  onOpenHelp,
  onOpenSafety
}) => {
  const [lastCommand, setLastCommand] = useState<string | null>(null);

  const handleCommand = (command: string) => {
    setLastCommand(command);
    
    // Process the command
    const lowerCommand = command.toLowerCase().trim();
    
    if (lowerCommand.includes('create task') || lowerCommand.includes('post task') || lowerCommand.includes('new task')) {
      elevenLabsService.speakText("Opening the create task form");
      onCreateTask();
    }
    else if (lowerCommand.includes('browse tasks') || lowerCommand.includes('find tasks') || lowerCommand.includes('show tasks')) {
      elevenLabsService.speakText("Taking you to the task marketplace");
      onBrowseTasks();
    }
    else if (lowerCommand.includes('wallet') || lowerCommand.includes('balance') || lowerCommand.includes('money')) {
      elevenLabsService.speakText("Opening your wallet");
      onOpenWallet();
    }
    else if (lowerCommand.includes('profile') || lowerCommand.includes('account') || lowerCommand.includes('my info')) {
      elevenLabsService.speakText("Opening your profile");
      onOpenProfile();
    }
    else if (lowerCommand.includes('help') || lowerCommand.includes('support') || lowerCommand.includes('assistance')) {
      elevenLabsService.speakText("Opening the help center");
      onOpenHelp();
    }
    else if (lowerCommand.includes('safety') || lowerCommand.includes('security') || lowerCommand.includes('protection')) {
      elevenLabsService.speakText("Opening safety features");
      onOpenSafety();
    }
    else {
      elevenLabsService.speakText("I'm sorry, I didn't understand that command. You can ask me to create a task, browse tasks, open your wallet, view your profile, get help, or check safety features.");
    }
  };

  return (
    <VoiceCommandListener onCommand={handleCommand} />
  );
};

export default VoiceCommandHandler;