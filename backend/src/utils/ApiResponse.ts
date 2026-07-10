export class ApiResponse<T> {
  public success: boolean;
  public message: string;
  public data?: T;

  constructor(message: string, data?: T, success: boolean = true) {
    this.success = success;
    this.message = message;
    if (data !== undefined) {
      this.data = data;
    }
  }
}
