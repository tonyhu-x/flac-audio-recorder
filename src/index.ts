import { InitMessagePayload } from './types.js';

class FlacAudioRecorder {
  private stream?: MediaStream;
  private source?: MediaStreamAudioSourceNode;
  private myProcessorNode?: AudioWorkletNode;

  constructor() {
    console.log('FlacAudioRecorder created');
  }

  async record() {
    console.log('Recording');
    // note: mediaDevices are only available in secure contexts
    // TODO: add error handling
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const tracks = this.stream.getAudioTracks();
    const trackSampleRate = tracks[0].getSettings().sampleRate;
    const trackChannelCount = tracks[0].getSettings().channelCount;
    let channelCount;
    if (trackChannelCount === undefined) {
      console.warn('Failed to obtain channel count from input device. Setting channel count to 1.');
      channelCount = 1;
    }
    else {
      console.log(`Input device channel count is ${trackChannelCount}`);
      channelCount = trackChannelCount;
    }

    // The sample rate of the created AudioContext is by default the output device's
    // preferred sample rate. Neither Firefox nor Safari supports setting sample rate
    // (at least on macOS). You can tell by quering navigator.mediaDevices. getSupportedConstraints().
    // Since that is the case, if the output device's sample rate is set very high and
    // does not match the input, then the audio will contain cracking noises.
    // If I insist on passing the input's sample rate to the encoder, then the encoded
    // file sounds wrong (slowed down).

    const audioContext = new AudioContext();
    console.log(`Input device sample rate is ${trackSampleRate}`);
    console.log(`Audio context sample rate is ${audioContext.sampleRate}`);
    if (trackSampleRate !== audioContext.sampleRate) {
      console.warn('Input device and audio context sample rate mismatch.');
    }

    this.source = audioContext.createMediaStreamSource(this.stream);
    // Prevent up-mixing
    this.source.channelCount = channelCount;
    this.source.channelCountMode = 'explicit';

    // Using ../dist/my_processor.js so that it works when compiled with tsc directly
    // AND when using webpack (where there is a separate task to bundle the worklet first)
    await audioContext.audioWorklet.addModule(new URL('../dist/my_processor.js', import.meta.url));
    console.log('AudioWorkletProcessor module loaded');
    this.myProcessorNode = new AudioWorkletNode(audioContext, 'my-processor');
    this.myProcessorNode.channelCount = channelCount;
    this.myProcessorNode.channelCountMode = 'explicit';

    const initMessagePayload: InitMessagePayload = {
      // sampleRate: audioContext.sampleRate,
      sampleRate: audioContext.sampleRate,
      channelCount,
    };

    this.myProcessorNode.port.postMessage({ cmd: 'init', initMessagePayload });

    this.source.connect(this.myProcessorNode);
  }

  async stop(): Promise<Blob> {
    console.log('Stopping recording');

    this.stream?.getAudioTracks()[0].stop();

    const promise: Promise<Blob> = new Promise((resolve) => {
      if (this.myProcessorNode === undefined) {
        throw new Error('myProcessorNode is undefined');
      }
      this.myProcessorNode.port.onmessage = (event) => {
        const blob = new Blob([event.data], { type: 'audio/flac' });
        resolve(blob);
      };
    });

    this.myProcessorNode?.port.postMessage({ cmd: 'finish' });
    this.myProcessorNode?.disconnect();
    this.source?.disconnect();

    return promise;
  }
}

export { FlacAudioRecorder };
