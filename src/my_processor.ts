import * as Flac from 'libflacjs/dist/libflac.wasm.js';
import { Encoder } from 'libflacjs/lib/encoder.js';

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
  encoder: Encoder | null = null;
  blockBuffers: Float32Array[][] = [];

  constructor(args?: AudioWorkletNodeOptions) {
    super(args);
    console.log('MyProcessor created');
  }

  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>,
  ): boolean {
    if (!this.encoder) {
      if (!Flac.isReady()) {
        this.blockBuffers.push(inputs[0]);
        return false;
      }
      else {
        // create the encoder
        console.log(`Creating encoder...`);
        console.log(`Sample rate: ${inputs[0].length}`);
        console.log(`Number of channels: ${inputs[0].length}`);
        this.encoder = new Encoder(
          Flac,
          {
            sampleRate,
            channels: inputs[0].length,
            compression: COMPRESSION,
            bitsPerSample: SAMPLE_SIZE,
            verify: true,
          },
        );
        // process the buffered inputs
        for (const block of this.blockBuffers) {
          this.doEncode(block);
        }
      }
    }

    this.doEncode(inputs[0]);
    // return false as per https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process
    return false;
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
        // convert to 16-bit signed integer
        view.setInt32(i * 4, channel[i] * (2 ** (SAMPLE_SIZE - 1)) - 1, true);
      }
      channelsI32.push(bufferI32);
    }
    if (!this.encoder?.encode(channelsI32)) {
      console.error('Encoding failed');
    }
  }
}

registerProcessor('my-processor', MyProcessor);
