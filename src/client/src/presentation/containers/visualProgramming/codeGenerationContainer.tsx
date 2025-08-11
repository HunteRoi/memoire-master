import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';

export interface CodeGenerationContextType {
  generatePythonCode: () => string;
  handleViewPythonCode: () => Promise<void>;
  handleUpdateCode: () => Promise<void>;
}

const CodeGenerationContext = createContext<CodeGenerationContextType | null>(
  null
);

export const useCodeGeneration = (): CodeGenerationContextType => {
  const context = useContext(CodeGenerationContext);
  if (!context) {
    throw new Error(
      'useCodeGeneration must be used within a CodeGenerationContainer'
    );
  }
  return context;
};

interface CodeGenerationContainerProps {
  children: ReactNode;
  nodes: any[]; // React Flow nodes for code generation
}

export const CodeGenerationContainer: React.FC<
  CodeGenerationContainerProps
> = ({ children, nodes }) => {
  const { t } = useTranslation();

  // Python code generation logic
  const generatePythonCode = useCallback(() => {
    if (nodes.length === 0) {
      const generatedComment = t(
        'visualProgramming.pythonViewer.generatedComment'
      );
      const basedOnComment = t('visualProgramming.pythonViewer.basedOnComment');
      const completedComment = t(
        'visualProgramming.pythonViewer.completedComment'
      );

      return `# ${generatedComment}
# ${basedOnComment}

import robot

# No blocks in script
print("${completedComment}")`;
    }

    const generatedComment = t(
      'visualProgramming.pythonViewer.generatedComment'
    );
    const basedOnComment = t('visualProgramming.pythonViewer.basedOnComment');

    let pythonCode = `# ${generatedComment}
# ${basedOnComment}

import robot
import time

def execute_block(block_type, block_name):
    """Execute a single block based on its type"""
    print(f"Executing: {block_name}")

    if block_type == 'move_forward':
        robot.move_forward()
    elif block_type == 'move_backward':
        robot.move_backward()
    elif block_type == 'turn_left':
        robot.turn_left()
    elif block_type == 'turn_right':
        robot.turn_right()
    elif block_type == 'distance_sensor':
        distance = robot.get_distance()
        print(f"Distance reading: {distance}")
        return distance
    elif block_type == 'light_sensor':
        light = robot.get_light_level()
        print(f"Light level: {light}")
        return light
    elif block_type == 'camera':
        image = robot.take_photo()
        print("Photo taken")
        return image
    elif block_type == 'wait':
        print("Waiting...")
        time.sleep(1)
    else:
        print(f"Unknown block type: {block_type}")

def main():
    """Main execution function"""
    print("Starting script execution...")

    # Execute all blocks independently
`;

    nodes.forEach(node => {
      pythonCode += `    execute_block("${node.data.blockType}", "${node.data.blockName}")  # ${node.data.blockIcon} ${node.data.blockName}\n`;
    });

    const completedComment = t(
      'visualProgramming.pythonViewer.completedComment'
    );
    pythonCode += `    print("${completedComment}")

if __name__ == "__main__":
    main()`;

    return pythonCode;
  }, [nodes, t]);

  const handleViewPythonCode = useCallback(async () => {
    const pythonCode = generatePythonCode();
    await window.electronAPI.pythonCodeViewer.openWindow(
      pythonCode,
      t('visualProgramming.pythonViewer.title') as string
    );
  }, [generatePythonCode, t]);

  const handleUpdateCode = useCallback(async () => {
    const pythonCode = generatePythonCode();
    await window.electronAPI.pythonCodeViewer.updateCode(pythonCode);
  }, [generatePythonCode]);

  const contextValue = useMemo<CodeGenerationContextType>(
    () => ({
      generatePythonCode,
      handleViewPythonCode,
      handleUpdateCode,
    }),
    [generatePythonCode, handleViewPythonCode, handleUpdateCode]
  );

  return (
    <CodeGenerationContext.Provider value={contextValue}>
      {children}
    </CodeGenerationContext.Provider>
  );
};
