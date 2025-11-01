/**
 * Voice Service for Text-to-Speech
 * Supports Marathi, Hindi, and English
 * Designed for rural India accessibility
 */

class VoiceService {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.utterance = null;
    this.isSupported = 'speechSynthesis' in window;
    this.isSpeaking = false;
  }

  /**
   * Check if speech synthesis is supported
   */
  isAvailable() {
    return this.isSupported;
  }

  /**
   * Get available voices for a language
   */
  getVoice(lang = 'mr-IN') {
    if (!this.isSupported) return null;
    
    const voices = this.synthesis.getVoices();
    
    // Try to find exact language match
    let voice = voices.find(v => v.lang === lang);
    
    // Fallback to language code only (e.g., 'mr' for Marathi)
    if (!voice) {
      const langCode = lang.split('-')[0];
      voice = voices.find(v => v.lang.startsWith(langCode));
    }
    
    // Fallback to any Indian language
    if (!voice) {
      voice = voices.find(v => v.lang.includes('IN'));
    }
    
    // Final fallback to default
    return voice || voices[0];
  }

  /**
   * Speak text in specified language
   */
  speak(text, lang = 'mr-IN', options = {}) {
    if (!this.isSupported) {
      console.warn('Speech synthesis not supported');
      return false;
    }

    // Stop any ongoing speech
    this.stop();

    const {
      rate = 0.85,      // Slower for clarity (rural users)
      pitch = 1.0,
      volume = 1.0,
      onStart = null,
      onEnd = null,
      onError = null
    } = options;

    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.lang = lang;
    this.utterance.rate = rate;
    this.utterance.pitch = pitch;
    this.utterance.volume = volume;

    // Set voice
    const voice = this.getVoice(lang);
    if (voice) {
      this.utterance.voice = voice;
    }

    // Event handlers
    this.utterance.onstart = () => {
      this.isSpeaking = true;
      if (onStart) onStart();
    };

    this.utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    this.utterance.onerror = (event) => {
      this.isSpeaking = false;
      console.error('Speech synthesis error:', event);
      if (onError) onError(event);
    };

    // Speak
    this.synthesis.speak(this.utterance);
    return true;
  }

  /**
   * Stop speaking
   */
  stop() {
    if (this.isSupported) {
      this.synthesis.cancel();
      this.isSpeaking = false;
    }
  }

  /**
   * Pause speaking
   */
  pause() {
    if (this.isSupported && this.isSpeaking) {
      this.synthesis.pause();
    }
  }

  /**
   * Resume speaking
   */
  resume() {
    if (this.isSupported) {
      this.synthesis.resume();
    }
  }

  /**
   * Speak district report in Marathi
   */
  speakDistrictReport(districtData, lang = 'mr') {
    const { district, rank, score, category, metrics } = districtData;
    
    let text = '';
    
    if (lang === 'mr') {
      // Marathi report
      text = `
        ${district} जिल्हा.
        रँक ${rank}.
        ${metrics.employmentProvided} लोकांना रोजगार मिळाला.
        ${metrics.worksCompleted} कामे पूर्ण झाली.
        कामगिरी ${category === 'Excellent' ? 'उत्कृष्ट' : 
                   category === 'Good' ? 'चांगली' : 
                   category === 'Average' ? 'सरासरी' : 
                   'सुधारणा आवश्यक'}.
      `;
    } else if (lang === 'hi') {
      // Hindi report
      text = `
        ${district} जिला.
        रैंक ${rank}.
        ${metrics.employmentProvided} लोगों को रोजगार मिला.
        ${metrics.worksCompleted} काम पूरे हुए.
        प्रदर्शन ${category === 'Excellent' ? 'उत्कृष्ट' : 
                   category === 'Good' ? 'अच्छा' : 
                   category === 'Average' ? 'औसत' : 
                   'सुधार की जरूरत'}.
      `;
    } else {
      // English report
      text = `
        ${district} District.
        Rank ${rank}.
        Employment provided to ${metrics.employmentProvided} people.
        ${metrics.worksCompleted} works completed.
        Performance is ${category}.
      `;
    }

    const langCode = lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
    
    return this.speak(text.trim(), langCode, {
      onStart: () => console.log('🔊 Speaking district report...'),
      onEnd: () => console.log('✅ Speech completed')
    });
  }

  /**
   * Speak metric value
   */
  speakMetric(metricName, value, lang = 'mr') {
    let text = '';
    
    if (lang === 'mr') {
      text = `${metricName}. ${value}`;
    } else if (lang === 'hi') {
      text = `${metricName}. ${value}`;
    } else {
      text = `${metricName}. ${value}`;
    }

    const langCode = lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
    return this.speak(text, langCode);
  }

  /**
   * Speak simple number
   */
  speakNumber(number, lang = 'mr') {
    const langCode = lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
    return this.speak(number.toString(), langCode);
  }

  /**
   * Test speech with greeting
   */
  testSpeech(lang = 'mr') {
    let greeting = '';
    
    if (lang === 'mr') {
      greeting = 'नमस्कार. मनरेगा जिल्हा माहिती मध्ये आपले स्वागत आहे.';
    } else if (lang === 'hi') {
      greeting = 'नमस्ते. मनरेगा जिला जानकारी में आपका स्वागत है.';
    } else {
      greeting = 'Welcome to MGNREGA District Information.';
    }

    const langCode = lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
    return this.speak(greeting, langCode);
  }
}

// Create singleton instance
const voiceService = new VoiceService();

export default voiceService;

// Export functions for easy import
export const {
  speak,
  stop,
  pause,
  resume,
  speakDistrictReport,
  speakMetric,
  speakNumber,
  testSpeech,
  isAvailable
} = voiceService;
