/**
 * This code is copied from the libflac.js project.
 * The original compiled .js code caused problems with webpack that I could not resolve.
 * Below is the original license.
 *
 * The MIT License (MIT)

 * Copyright (c) 2014-2020 DFKI GmbH
 *
 * based on FLAC encoder:
 * Copyright (C) 2000-2009  Josh Coalson
 * Copyright (C) 2011-2014  Xiph.Org Foundation
 *
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

export function getLength(recBuffers: Uint8Array[]): number {
  let recLength = 0;
  for (let i = recBuffers.length - 1; i >= 0; --i) {
    recLength += recBuffers[i].byteLength;
  }
  return recLength;
}

export function mergeBuffers(channelBuffer: Uint8Array[], recordingLength: number): Uint8Array {
  const result = new Uint8Array(recordingLength);
  let offset = 0;
  const lng = channelBuffer.length;
  for (let i = 0; i < lng; i++) {
    const buffer = channelBuffer[i];
    result.set(buffer, offset);
    offset += buffer.length;
  }
  return result;
}

export function getLengthFor(recBuffers: Uint8Array[][], index: number, sampleBytes: number, bytePadding: number) {
  let recLength = 0, blen;
  const decrFac = bytePadding > 0 ? bytePadding / sampleBytes : 0;// <- factor do decrease size in case of padding bytes
  for (let i = recBuffers.length - 1; i >= 0; --i) {
    blen = recBuffers[i][index].byteLength;
    if (bytePadding > 0) {
      recLength += blen - (decrFac * blen);
    }
    else {
      recLength += blen;
    }
  }
  return recLength;
}
