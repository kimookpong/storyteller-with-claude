import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setConcurrency(null);
// ถ้าเครื่องไม่มี Chrome ของ Remotion ให้ตั้ง REMOTION_BROWSER_EXECUTABLE
if (process.env.REMOTION_BROWSER_EXECUTABLE) Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
