export class TimeConverter {
  static msToMin = 1 / (1000 * 60);
  static msToHours = TimeConverter.msToMin / 60;
  static minToMs = 1000 * 60;
  static hToMs = TimeConverter.minToMs * 60;
  static dayToMs = TimeConverter.hToMs * 24;
}
