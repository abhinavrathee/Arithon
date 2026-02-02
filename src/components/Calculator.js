import React, { useState, useEffect, useCallback } from 'react';
import { RotateCw, Sun, Moon, Copy, Check, History } from 'lucide-react';
import { useMediaQuery } from 'react-responsive';
import { getTheme } from '../theme';

const Calculator = () => {
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const isScreenLandscape = useMediaQuery({ orientation: 'landscape' });

  // Expression handling state
  const [display, setDisplay] = useState('0'); // Current number being typed or result
  const [expression, setExpression] = useState(''); // The full math expression (e.g., "12 * (5 + ")
  const [lastWasResult, setLastWasResult] = useState(false); // Track if last action was =

  // Legacy states (keeping for now during transition)
  const [firstNumber, setFirstNumber] = useState(null);
  const [operation, setOperation] = useState(null);
  const [newNumber, setNewNumber] = useState(false);

  // UI and feature states
  const [isLandscape, setIsLandscape] = useState(false);
  const [memory, setMemory] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isResult, setIsResult] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const theme = getTheme(isDarkMode);

  // Safe evaluation function with sanitization
  const safeEvaluate = (expr) => {
    try {
      // Validate: Only numbers, operators, parentheses, and Math functions allowed
      // Using a regex to strip out anything unsafe before eval
      // We allow: 0-9, ., +, -, *, /, %, (, ), spaces, and Math.x functions
      const sanitized = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/sqrt/g, 'Math.sqrt')
        .replace(/log/g, 'Math.log10')
        .replace(/ln/g, 'Math.log')
        .replace(/pi/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/\^/g, '**');

      // Handle implicit multiplication:
      // 1. Number( -> Number*(
      // 2. )Number -> )*Number
      // 3. )( -> )*(
      let finalStr = sanitized.replace(/(\d)\s*\(/g, '$1*(');
      finalStr = finalStr.replace(/\)\s*(\d)/g, ')*$1');
      finalStr = finalStr.replace(/\)\s*\(/g, ')*(');

      // Double check simple sanitization
      if (/[^0-9.\-+*/%()espa\sMath.incostanqrtlogpieE\^]/.test(finalStr)) {
        return 'Error';
      }

      // eslint-disable-next-line no-new-func
      return new Function('return ' + finalStr)();
    } catch (error) {
      return 'Error';
    }
  };

  // Format number helper function
  const formatNumber = (num) => {
    if (String(num).length > 12) {
      return num.toPrecision(10);
    }
    return num.toString();
  };

  // Calculate function with history tracking
  const calculate = useCallback(() => {
    setShowHistory(false);

    let finalExpr = expression;

    // Fix: check if expression ends with ) and display is just 0, don't append
    // If expression ends with operator, we DO need the 0 (e.g. "5 + ") -> "5 + 0"
    const trimmedExpr = expression.trim();
    if (trimmedExpr.endsWith(')') && display === '0') {
      // Don't append the 0
    } else if (display !== '0' || (expression === '' || /[+\-*\/\/(]$/.test(trimmedExpr))) {
      finalExpr += display;
    }

    if (!finalExpr) return;

    const result = safeEvaluate(finalExpr);

    if (result === 'Error' || isNaN(result) || !isFinite(result)) {
      setDisplay('Error');
      setExpression('');
      setLastWasResult(true);
      return;
    }

    const formattedResult = formatNumber(result);

    // Add to history
    setHistory(prev => [{
      eq: finalExpr.replace(/\*/g, '×').replace(/\//g, '÷'),
      res: formattedResult
    }, ...prev].slice(0, 10));

    setDisplay(formattedResult);
    setExpression(''); // Clear expression, result becomes new start
    setLastWasResult(true);
    setIsResult(true);

  }, [display, expression, safeEvaluate]);

  const handleCopy = () => {
    if (display === 'Error' || !display) return;
    navigator.clipboard.writeText(display).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => console.error('Failed to copy: ', err));
  };

  useEffect(() => {
    const handleKeyPress = (event) => {
      const { key } = event;
      if (!isNaN(key)) {
        handleNumber(key);
      } else if (key === '+') {
        handleOperation('+');
      } else if (key === '-') {
        handleOperation('-');
      } else if (key === '*') {
        handleOperation('×');
      } else if (key === '/') {
        handleOperation('÷');
      } else if (key === 'Enter' || key === '=') {
        calculate();
      } else if (key === 'Escape') {
        handleClear();
      } else if (key === '.') {
        handleDecimal();
      } else if (key === '%') {
        handlePercent();
      } else if (key === 'Backspace') {
        handleBackspace();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [display, firstNumber, operation, newNumber]);

  // Calculator functions remain the same
  // Handle number input with expression tracking
  const handleNumber = useCallback((num) => {
    setShowHistory(false);
    if (display === 'Error' || lastWasResult) {
      setDisplay(num.toString());
      setExpression('');
      setLastWasResult(false);
      return;
    }

    if (display === '0') {
      setDisplay(num.toString());
    } else {
      setDisplay(display + num);
    }
    setIsResult(false); // User is typing, not showing a result
  }, [display, lastWasResult]);

  // Handle operation input with expression tracking
  const handleOperation = useCallback((op) => {
    setShowHistory(false);
    if (display === 'Error') return;

    let currentExpr = expression;
    let currentDisplay = display;

    if (lastWasResult) {
      currentExpr = display;
      setLastWasResult(false);
    } else {
      // Logic Update: Check if we need to append currentDisplay
      const trimmedExpr = currentExpr.trim();

      // If display is 0, we might be changing the operator
      if (currentDisplay === '0' && /[+\-*/]$/.test(trimmedExpr)) {
        // Replace the last operator
        currentExpr = trimmedExpr.slice(0, -1);
      } else if (trimmedExpr.endsWith(')') && currentDisplay === '0') {
        // Do nothing, just use currentExpr as is
      } else {
        currentExpr += currentDisplay;
      }
    }

    // Add the operator
    setExpression(currentExpr + ' ' + op + ' ');
    setDisplay('0');
    setIsResult(false);
  }, [display, expression, lastWasResult]);

  // Handle parenthesis input with expression tracking
  const handleParenthesis = useCallback((type) => {
    setShowHistory(false);

    // If starting fresh after result
    if (lastWasResult) {
      if (type === ')') return; // Can't start with )
      // If we have a result, and press (, do we want "Ans * ("?
      // Preserve result as implicit multiplier.
      setExpression(display + ' ( ');
      setDisplay('0');
      setLastWasResult(false);
      return;
    }

    if (type === '(') {
      // Fix for "press 1 and then bracket": Append current display if it's there
      if (display !== '0') {
        setExpression(prev => prev + display + ' ( ');
        setDisplay('0');
      } else {
        setExpression(prev => prev + ' ( ');
      }
    } else {
      // Closing parenthesis
      if (display !== '0') {
        setExpression(prev => prev + display + ' ) ');
        setDisplay('0');
      } else {
        setExpression(prev => prev + ' ) ');
      }
    }
  }, [display, lastWasResult]);

  // Handle scientific functions with expression tracking
  const handleScientific = (func) => {
    setShowHistory(false);
    if (display === 'Error') return;

    let newExpr = expression;

    if (lastWasResult) {
      newExpr = display;
      setLastWasResult(false);
    } else {
      if (display !== '0') {
        newExpr += display;
      }
    }

    // Add func to expression
    setExpression(newExpr + ` ${func}(`);
    setDisplay('0');
    setIsResult(false);
  };

  // Special for square/cube/one-over/sqrt which are immediate
  const handleImmediateScientific = (func) => {
    setShowHistory(false);
    const val = parseFloat(display);
    let res = 0;
    switch (func) {
      case 'square': res = val * val; break;
      case 'cube': res = val * val * val; break;
      case 'sqrt': res = Math.sqrt(val); break;
      case '1/x': res = 1 / val; break;
      default: return;
    }
    setDisplay(formatNumber(res));
    setIsResult(true);
  };

  // Handle clear with expression reset
  const handleClear = useCallback(() => {
    setShowHistory(false);
    setDisplay('0');
    setExpression('');
    setLastWasResult(false);
    setIsResult(false);
  }, []);

  const handleBackspace = () => {
    setShowHistory(false);
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handlePercent = () => {
    setShowHistory(false);
    const current = parseFloat(display);
    setDisplay((current / 100).toString());
    setIsResult(true); // Percent operation produces a result
  };

  const handlePlusMinus = () => {
    setShowHistory(false);
    setDisplay((parseFloat(display) * -1).toString());
    setIsResult(true); // Plus/minus operation produces a result
  };

  const handleDecimal = () => {
    setShowHistory(false);
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
    setIsResult(false); // User is typing
  };

  const handleMemory = (action) => {
    setShowHistory(false);
    switch (action) {
      case 'MC': setMemory(0); break;
      case 'MR':
        setDisplay(memory.toString());
        setIsResult(true);
        break;
      case 'M+': setMemory(memory + parseFloat(display)); break;
      case 'M-': setMemory(memory - parseFloat(display)); break;
      default: break;
    }
  };

  const Button = ({ label, onClick, className, wide }) => (
    <button
      onClick={onClick}
      className={`${wide ? 'col-span-2 w-full' : 'w-full'} 
        ${isLandscape ? 'h-12 text-lg' : 'h-16 text-2xl'} 
        rounded-full font-light focus:outline-none active:opacity-75 transition-all ${className}`}
    >
      {label}
    </button>
  );

  return (
    <div className={`${(!isMobile && !isLandscape) ? 'h-screen overflow-hidden' : 'min-h-screen overflow-y-auto'} w-full ${theme.bg} ${theme.textMain} relative transition-colors duration-500`}>
      {/* Animated Gradient Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-48 -left-48 w-96 h-96 ${theme.blobs[0]} rounded-full blur-3xl animate-pulse`}></div>
        <div className={`absolute top-1/2 -right-48 w-96 h-96 ${theme.blobs[1]} rounded-full blur-3xl animate-pulse delay-1000`}></div>
        <div className={`absolute -bottom-48 left-1/4 w-96 h-96 ${theme.blobs[2]} rounded-full blur-3xl animate-pulse delay-2000`}></div>
      </div>

      <div className={`${(!isMobile && !isLandscape) ? 'h-full' : 'min-h-screen'} w-full flex flex-col items-center relative z-10 px-4 py-8`}>
        {/* Activity Bar - Strictly Top-Fixed and Non-Rotating */}
        <div className="flex items-center justify-between w-full max-w-md mb-8 px-4 flex-shrink-0">
          <h1 className={`text-2xl font-bold ${theme.headerGradient} bg-clip-text text-transparent`}>
            Arithon
          </h1>

          <div className="flex gap-2">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`${theme.iconBtn} p-3 rounded-2xl transition-all shadow-lg`}
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>

            {/* Rotate Button */}
            <button
              onClick={() => setIsLandscape(!isLandscape)}
              className={`${theme.btnOp} p-3 rounded-2xl shadow-lg transition-all z-20`}
              aria-label="Toggle calculator mode"
            >
              <RotateCw size={24} />
            </button>
          </div>
        </div>

        {/* Calculator Container - Handles internal rotation only */}
        <div className="flex-1 w-full flex items-center justify-center overflow-visible">
          <div className={`transition-all duration-700 ease-in-out transform flex items-center justify-center
              ${!isMobile ? (
              isLandscape ? 'scale-95' : 'scale-90 lg:scale-100'
            ) : (
              isLandscape
                ? 'scale-[0.82] rotate-90 origin-center'
                : 'scale-[1.05] origin-center'
            )}
            `}>
            {/* Custom Glass Slab Frame */}
            <div className={`p-1.5 relative shadow-[0_0_50px_rgba(0,0,0,0.3)] transition-all duration-700 rounded-[40px] overflow-hidden
                ${isDarkMode ? 'bg-slate-800/20 border border-slate-700/50' : 'bg-white/20 border border-white/50'}
                ${isLandscape || (isMobile && isScreenLandscape)
                ? 'w-[780px] h-[450px]'
                : 'w-[340px] h-[620px]'
              }`}>
              {/* Subtle Frame Glow */}
              <div className={`absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-br ${isDarkMode ? 'from-indigo-500/20 to-transparent' : 'from-orange-500/10 to-transparent'}`}></div>

              {/* Minimalist Inset Screen */}
              <div className={`w-full h-full relative overflow-hidden rounded-[35px] shadow-inner
                  ${isDarkMode ? 'bg-slate-950/40 backdrop-blur-3xl' : 'bg-white/40 backdrop-blur-2xl'}`}>
                {/* Calculator Content */}
                <div className={`w-full h-full flex flex-col items-center justify-start ${isLandscape ? 'pt-4' : 'pt-28'} transition-colors duration-500 relative`}>
                  {/* History Toggle (Internal Top-Right) */}
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`absolute ${isLandscape ? 'top-4' : 'top-10'} right-6 p-2 rounded-full transition-all z-30 ${showHistory ? 'text-indigo-400 bg-indigo-500/10' : theme.textSub + ' hover:text-indigo-400'}`}
                    title="History"
                  >
                    <History size={20} />
                  </button>

                  <div className={`w-full ${isLandscape || (isMobile && isScreenLandscape) ? 'px-3 pb-2' : 'px-6 pb-4'}`}>
                    {/* Display Area Wrapper with History Panel */}
                    <div className="mb-4 relative group">
                      {showHistory && (
                        <div className={`absolute top-0 right-0 w-full h-full rounded-2xl z-20 p-4 overflow-y-auto backdrop-blur-md border ${theme.historyBg} transition-all duration-300`}>
                          <h3 className={`${theme.textSub} text-sm mb-2 font-medium`}>History</h3>
                          {history.length === 0 ?
                            <p className={`${theme.textSub} text-xs text-center mt-3`}>No history yet</p> :
                            history.map((item, i) => (
                              <div
                                key={i}
                                className={`mb-1 text-right border-b border-gray-500/10 pb-1 last:border-0 ${theme.historyItemHover} rounded p-1 cursor-pointer`}
                                onClick={() => {
                                  setDisplay(item.res);
                                  setExpression(item.res);
                                  setShowHistory(false);
                                }}
                              >
                                <div className={`${theme.textSub} text-xs`}>{item.eq}</div>
                                <div className="text-indigo-400 font-medium text-sm">{item.res}</div>
                              </div>
                            ))
                          }
                        </div>
                      )}

                      <div className={`p-4 rounded-2xl ${theme.displayBg} border ${theme.displayBg.includes('border') ? '' : 'border-transparent'} transition-colors duration-500`}>
                        {/* Copy Button */}
                        {display !== 'Error' && isResult && (
                          <button
                            onClick={handleCopy}
                            className={`absolute top-3 left-3 p-1.5 rounded-lg transition-all 
                                          opacity-0 group-hover:opacity-100 
                                          ${theme.iconBtn} hover:bg-slate-500/10`}
                            title="Copy Result"
                          >
                            {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                          </button>
                        )}
                        {/* Live Preview Expression */}
                        <div className={`${theme.previewText} text-sm mb-1 font-medium overflow-hidden whitespace-nowrap text-ellipsis h-6 text-right`}>
                          {(expression + (display && display !== '0' && display !== 'Error' ? display : '')).replace(/\*/g, '×').replace(/\//g, '÷')}
                        </div>
                        {/* Main Display */}
                        <div className={`font-light transition-all ${theme.displayText} ${display.length > 12 ? 'text-3xl' : 'text-5xl'} text-right`}>
                          {display}
                        </div>
                      </div>
                    </div>

                    {/* Button Grid */}
                    <div className={`grid ${isLandscape || (isMobile && isScreenLandscape)
                      ? 'grid-cols-8 gap-1.5'
                      : 'grid-cols-4 gap-2'}`}>

                      {isLandscape ? (
                        <>
                          <Button label="sin" onClick={() => handleScientific('sin')} className={theme.btnSecondary} />
                          <Button label="cos" onClick={() => handleScientific('cos')} className={theme.btnSecondary} />
                          <Button label="tan" onClick={() => handleScientific('tan')} className={theme.btnSecondary} />
                          <Button label="√" onClick={() => handleImmediateScientific('sqrt')} className={theme.btnSecondary} />
                          <Button label="AC" onClick={handleClear} className={theme.btnAc} />
                          <Button label="±" onClick={handlePlusMinus} className={theme.btnSecondary} />
                          <Button label="%" onClick={handlePercent} className={theme.btnSecondary} />
                          <Button label="÷" onClick={() => handleOperation('÷')} className={theme.btnOp} />

                          <Button label="x²" onClick={() => handleImmediateScientific('square')} className={theme.btnSecondary} />
                          <Button label="x³" onClick={() => handleImmediateScientific('cube')} className={theme.btnSecondary} />
                          <Button label="log" onClick={() => handleScientific('log')} className={theme.btnSecondary} />
                          <Button label="ln" onClick={() => handleScientific('ln')} className={theme.btnSecondary} />
                          {[7, 8, 9].map((num) => (
                            <Button key={num} label={num} onClick={() => handleNumber(num)} className={theme.btnPrimary} />
                          ))}
                          <Button label="×" onClick={() => handleOperation('×')} className={theme.btnOp} />

                          <Button label="π" onClick={() => handleScientific('pi')} className={theme.btnSecondary} />
                          <Button label="e" onClick={() => handleScientific('e')} className={theme.btnSecondary} />
                          <Button label="(" onClick={() => handleParenthesis('(')} className={theme.btnSecondary} />
                          <Button label=")" onClick={() => handleParenthesis(')')} className={theme.btnSecondary} />
                          {[4, 5, 6].map((num) => (
                            <Button key={num} label={num} onClick={() => handleNumber(num)} className={theme.btnPrimary} />
                          ))}
                          <Button label="-" onClick={() => handleOperation('-')} className={theme.btnOp} />

                          <Button label="1/x" onClick={() => handleImmediateScientific('1/x')} className={theme.btnSecondary} />
                          <Button label="x!" onClick={() => { }} className={theme.btnSecondary} />
                          <Button label="EE" onClick={() => { }} className={theme.btnSecondary} />
                          <Button label="Rad" onClick={() => { }} className={theme.btnSecondary} />
                          {[1, 2, 3].map((num) => (
                            <Button key={num} label={num} onClick={() => handleNumber(num)} className={theme.btnPrimary} />
                          ))}
                          <Button label="+" onClick={() => handleOperation('+')} className={theme.btnOp} />

                          <Button label="MC" onClick={() => handleMemory('MC')} className={theme.btnSecondary} />
                          <Button label="MR" onClick={() => handleMemory('MR')} className={theme.btnSecondary} />
                          <Button label="M+" onClick={() => handleMemory('M+')} className={theme.btnSecondary} />
                          <Button label="M-" onClick={() => handleMemory('M-')} className={theme.btnSecondary} />
                          <Button label="0" onClick={() => handleNumber(0)} className={theme.btnPrimary} />
                          <Button label="." onClick={handleDecimal} className={theme.btnPrimary} />
                          <Button label="=" onClick={calculate} className={`${theme.equalsGradient} text-white col-span-2 shadow-lg`} />
                        </>
                      ) : (
                        <>
                          <Button label="AC" onClick={handleClear} className={theme.btnAc} />
                          <Button label="±" onClick={handlePlusMinus} className={theme.btnSecondary} />
                          <Button label="%" onClick={handlePercent} className={theme.btnSecondary} />
                          <Button label="÷" onClick={() => handleOperation('÷')} className={theme.btnOp} />

                          {[7, 8, 9].map((num) => (
                            <Button key={num} label={num} onClick={() => handleNumber(num)} className={theme.btnPrimary} />
                          ))}
                          <Button label="×" onClick={() => handleOperation('×')} className={theme.btnOp} />

                          {[4, 5, 6].map((num) => (
                            <Button key={num} label={num} onClick={() => handleNumber(num)} className={theme.btnPrimary} />
                          ))}
                          <Button label="-" onClick={() => handleOperation('-')} className={theme.btnOp} />

                          {[1, 2, 3].map((num) => (
                            <Button key={num} label={num} onClick={() => handleNumber(num)} className={theme.btnPrimary} />
                          ))}
                          <Button label="+" onClick={() => handleOperation('+')} className={theme.btnOp} />

                          <Button label="0" onClick={() => handleNumber(0)} className={`col-span-2 ${theme.btnPrimary}`} />
                          <Button label="." onClick={handleDecimal} className={theme.btnPrimary} />
                          <Button label="=" onClick={calculate} className={`${theme.equalsGradient} text-white shadow-lg`} />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
};

export default Calculator;