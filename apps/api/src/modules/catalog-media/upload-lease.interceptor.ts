import { CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor } from '@nestjs/common';
import { finalize, Observable } from 'rxjs';

@Injectable()
export class MediaPrivacyHeadersInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    context.switchToHttp().getResponse().setHeader('Cache-Control', 'private, no-store');
    context.switchToHttp().getResponse().setHeader('X-Content-Type-Options', 'nosniff');
    return next.handle();
  }
}

@Injectable()
export class MediaUploadLeaseInterceptor implements NestInterceptor {
  private active = 0;
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (this.active >= 2) throw new HttpException('Image uploads are busy; retry later', 429);
    this.active++;
    try { return next.handle().pipe(finalize(() => { this.active--; })); }
    catch (error) { this.active--; throw error; }
  }
}
