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

import { Flac, ReadyEvent } from './libflacjs/index.js';

/**
 * Helper class for encoder / decoder:
 *
 * can cache function calls on the encoder/decoder, when Flac is not ready yet,
 * and then applies them, when Flac becomes ready.
 */
export class BeforeReadyHandler<Target, ChacheableCalls> {
  private _enabled: boolean = false;

  private _isWaitOnReady: boolean = false;
  private _onReadyHandler?: (evt: ReadyEvent) => void;
  private _beforeReadyCache?: { func: ChacheableCalls; args: any[] }[];

  public get isWaitOnReady(): boolean {
    return this._isWaitOnReady;
  }

  public get enabled(): boolean {
    return this._enabled;
  }

  public set enabled(val: boolean) {
    if (!val && this._enabled) {
      this._reset();
    }
    this._enabled = this.enabled;
  }

  public constructor(private _target: Target, enabled: boolean, private Flac: Flac) {
    this._enabled = enabled;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public handleBeforeReady(funcName: ChacheableCalls, args: ArrayLike<any>): boolean {
    if (!this.Flac.isReady() && this.enabled) {
      if (!this._isWaitOnReady) {
        this._beforeReadyCache = this._beforeReadyCache || [];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        this._onReadyHandler = (_evt: ReadyEvent): void => {
          if (this._beforeReadyCache) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this._beforeReadyCache.forEach(entry => (this._target as any)[entry.func].apply(this._target, entry.args));
          }
          this._reset();
        };
        this.Flac.on('ready', this._onReadyHandler);
        this._isWaitOnReady = true;
      }

      if (this._beforeReadyCache) {
        this._beforeReadyCache.push({ func: funcName, args: Array.from(args) });
        return true;
      }
    }
    return false;
  }

  private _reset(): void {
    if (this._beforeReadyCache) {
      this._beforeReadyCache = void (0);
    }
    if (this._onReadyHandler) {
      this.Flac.off('ready', this._onReadyHandler);
      this._onReadyHandler = void (0);
    }
    this._isWaitOnReady = false;
  }
}
