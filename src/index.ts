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
    const sampleRate = this.stream.getAudioTracks()[0].getSettings().sampleRate;
    if (sampleRate === undefined) {
      throw new Error('Sample rate is undefined');
    }
    console.log(`Media stream sample rate: ${sampleRate}`);

    const audioContext = new AudioContext({ sampleRate });
    this.source = audioContext.createMediaStreamSource(this.stream);
    const channelCount = this.source.channelCount;
    console.log(`Channel count: ${channelCount}`);
    // using ../dist/my_processor.js so that it works when compiled with tsc directly
    // AND when using webpack (where there is a separate task to bundle the worklet first)
    await audioContext.audioWorklet.addModule(new URL('../dist/my_processor.js', import.meta.url));
    console.log('AudioWorkletProcessor module loaded');
    this.myProcessorNode = new AudioWorkletNode(audioContext, 'my-processor');

    const initMessagePayload: InitMessagePayload = {
      sampleRate,
      channelCount,
    };

    this.myProcessorNode.port.postMessage({ cmd: 'init', initMessagePayload });
    this.myProcessorNode.port.onmessage = (event) => {
      const blob = new Blob([event.data], { type: 'audio/flac' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'recording.flac';
      // we need to append the element to the DOM, otherwise it will not work in firefox
      document.body.appendChild(a);
      a.click();
      a.remove();
    };

    this.source.connect(this.myProcessorNode);
    this.myProcessorNode.connect(audioContext.destination);
  }

  stop() {
    console.log('Stopping recording');
    this.stream?.getAudioTracks()[0].stop();
    this.myProcessorNode?.port.postMessage({ cmd: 'finish' });
    this.myProcessorNode?.disconnect();
    this.source?.disconnect();
  }
}

export { FlacAudioRecorder };
