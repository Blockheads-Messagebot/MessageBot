export {send} from './send';

import {Storage} from 'libraries/storage';
//tslint:disable-next-line:no-any
export const storage = new Storage((<any>window).worldId);

import {Hook} from 'libraries/hook';
export const hook = new Hook();

import {World} from 'libraries/world';
export const world = new World();

export const version = '6.2.0';
storage.set('mb_version', version, false);
