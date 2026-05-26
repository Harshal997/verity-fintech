import { NativeModule, requireNativeModule } from 'expo';

import { SmsReaderModuleEvents } from './SmsReader.types';

declare class SmsReaderModule extends NativeModule<SmsReaderModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<SmsReaderModule>('SmsReader');
