// TODO: change this
// import * as Flac from './libflacjs/dist/libflac.dev.wasm.js';
// importing from the lib folder causes problems with webpack
import { Encoder } from './encoder.js';
import * as Flac from './libflacjs/dist/libflac.dev.js';
import { InitMessagePayload } from './types.js';

/**
 * Type and global variable declarations for AudioWorkletGlobalScope
 *
 * Code taken from https://github.com/microsoft/TypeScript/issues/28308#issuecomment-1921865859
 */

interface AudioWorkletProcessor {
  readonly port: MessagePort;
}

interface AudioWorkletProcessorImpl extends AudioWorkletProcessor {
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean;
}

// eslint-disable-next-line no-var
declare var AudioWorkletProcessor: {
  prototype: AudioWorkletProcessor;
  new (options?: AudioWorkletNodeOptions): AudioWorkletProcessor;
};

// eslint-disable-next-line no-var
declare var sampleRate: number;

type AudioParamDescriptor = {
  name: string;
  automationRate: AutomationRate;
  minValue: number;
  maxValue: number;
  defaultValue: number;
};

interface AudioWorkletProcessorConstructor {
  new (options?: AudioWorkletNodeOptions): AudioWorkletProcessorImpl;
  parameterDescriptors?: AudioParamDescriptor[];
}

declare function registerProcessor(
  name: string,
  processorCtor: AudioWorkletProcessorConstructor,
): void;

// ----------------------------------------------------------------------------

const COMPRESSION = 5;
const SAMPLE_SIZE = 16;

class MyProcessor extends AudioWorkletProcessor {
  private encoder?: Encoder;
  private blockBuffers: Float32Array[][] = [];
  private initMessagePayload?: InitMessagePayload;
  private finished = false;

  constructor(args?: AudioWorkletNodeOptions) {
    super(args);

    this.port.onmessage = (event) => {
      console.log('Message received');
      console.log(`Message type is ${event.data.cmd}`);

      switch (event.data.cmd) {
        case 'init': {
          this.initMessagePayload = event.data.initMessagePayload as InitMessagePayload;
          console.log(`Will create encoder with:`);
          console.log(`- Sample rate: ${this.initMessagePayload.sampleRate}`);
          console.log(`- Number of channels: ${this.initMessagePayload.channelCount}`);
          Flac.on('ready', () => {
            console.log('Flac is ready');
            this.encoder = new Encoder(
              Flac,
              {
                sampleRate: this.initMessagePayload!.sampleRate,
                channels: this.initMessagePayload!.channelCount,
                compression: COMPRESSION,
                bitsPerSample: SAMPLE_SIZE,
                verify: true,
              },
            );
            console.log('Encoder has been initailized');
          });
          break;
        }
        case 'finish': {
          this.finished = true;
          if (!this.encoder) {
            throw new Error('Encoder not initialized with "init" message, or nothing to finish');
          }
          this.port.postMessage(this.encoder.getSamples());
          break;
        }
        default:
          throw new Error('Unknown or undefined message type');
      }
    };

    console.log('MyProcessor created');
  }

  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>,
  ): boolean {
    if (this.finished) {
      return false;
    }

    if (!Flac.isReady() || !this.encoder) {
      this.blockBuffers.push(inputs[0]);
      // return false as per https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process
      return true;
    }

    if (this.blockBuffers.length > 0) {
      console.log('Processing buffered inputs. This should only be printed once');
      // process the buffered inputs
      for (const block of this.blockBuffers) {
        this.doEncode(block);
      }
      this.blockBuffers = [];
    }

    this.doEncode(inputs[0]);
    // return false as per https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process
    return true;
  }

  /**
   * Converts the input buffer to Int32Array and encodes it.
   */
  doEncode(input: Float32Array[]) {
    const channelsI32: Int32Array[] = [];
    for (const channel of input) {
      const bufferI32 = new Int32Array(channel.length);
      const view = new DataView(bufferI32.buffer);
      for (let i = 0; i < channel.length; i++) {
        // convert to SAMPLE_SIZE signed integer
        view.setInt32(i * 4, channel[i] * (2 ** (SAMPLE_SIZE - 1)) - 1, true);
      }
      channelsI32.push(bufferI32);
    }
    if (!this.encoder?.encode(channelsI32)) {
      throw new Error('Encoding failed');
    }
  }
}

registerProcessor('my-processor', MyProcessor);
