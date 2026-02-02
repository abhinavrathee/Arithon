// Arithon Calculator Theme Configuration

export const themes = {
  dark: {
    // Background
    bg: 'bg-slate-950',
    blobs: ['bg-purple-500/20', 'bg-blue-500/10', 'bg-cyan-500/20'],

    // Text
    textMain: 'text-white',
    textSub: 'text-slate-400',

    // Calculator Body
    calcBody: 'bg-slate-900/40 border-slate-700/50 shadow-2xl backdrop-blur-xl',

    // Display
    displayBg: 'bg-slate-800/50 border-slate-700/30',
    displayText: 'text-white',
    previewText: 'text-slate-400',

    // Buttons
    btnPrimary: 'bg-slate-800/80 hover:bg-slate-700/80 text-white',
    btnSecondary: 'bg-slate-700/50 hover:bg-slate-600/50 text-cyan-300',
    btnOp: 'bg-indigo-500 hover:bg-indigo-600 text-white',
    btnAc: 'text-red-400 !bg-red-500/10 hover:!bg-red-500/20',

    // Controls
    iconBtn: 'hover:bg-indigo-500/20 text-slate-300',

    // History
    historyBg: 'bg-slate-800/95 border-slate-700',
    historyItemHover: 'hover:bg-slate-700/30',

    // Special Elements
    headerGradient: 'bg-gradient-to-r from-cyan-400 to-indigo-400',
    equalsGradient: 'bg-gradient-to-r from-indigo-500 to-purple-500',

    // Mobile Frame
    frameBorder: 'border-gray-800',
    frameBg: 'bg-gray-900',
    notchBg: 'bg-black',
    notchInner: 'bg-gray-800',
  },

  light: {
    // Background
    bg: 'bg-gray-100',
    blobs: ['bg-orange-300/30', 'bg-pink-300/20', 'bg-yellow-200/40'],

    // Text
    textMain: 'text-gray-800',
    textSub: 'text-gray-500',

    // Calculator Body
    calcBody: 'bg-white/60 border-white/50 shadow-xl',

    // Display
    displayBg: 'bg-gray-50/80 border-gray-200',
    displayText: 'text-gray-800',
    previewText: 'text-gray-400',

    // Buttons
    btnPrimary: 'bg-white hover:bg-gray-50 text-gray-700 shadow-sm border border-gray-100',
    btnSecondary: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100',
    btnOp: 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200',
    btnAc: 'text-red-500 bg-red-50 hover:bg-red-100 border border-red-100',

    // Controls
    iconBtn: 'hover:bg-gray-200 text-gray-500',

    // History
    historyBg: 'bg-white/95 border-gray-200',
    historyItemHover: 'hover:bg-gray-100',

    // Special Elements
    headerGradient: 'bg-gradient-to-r from-cyan-400 to-indigo-400',
    equalsGradient: 'bg-gradient-to-r from-indigo-500 to-purple-500',

    // Mobile Frame
    frameBorder: 'border-gray-300',
    frameBg: 'bg-white',
    notchBg: 'bg-gray-200',
    notchInner: 'bg-gray-300',
  }
};

export const getTheme = (isDarkMode) => isDarkMode ? themes.dark : themes.light;
