import { requireNativeModule } from "expo";
import type { HegemonyModuleType } from "./HegemonyModule.types";

export default requireNativeModule<HegemonyModuleType>("Hegemony");
