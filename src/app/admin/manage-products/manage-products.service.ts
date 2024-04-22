import { Injectable, Injector } from '@angular/core';
import { EMPTY, Observable, of, throwError } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { catchError, switchMap } from 'rxjs/operators';
import { NotificationService } from 'src/app/core/notification.service';

@Injectable()
export class ManageProductsService extends ApiService {
  constructor(
    injector: Injector,
    private readonly notificationService: NotificationService
  ) {
    super(injector);
  }

  uploadProductsCSV(file: File): Observable<unknown> {
    if (!this.endpointEnabled('import')) {
      console.warn(
        'Endpoint "import" is disabled. To enable change your environment.ts config'
      );
      return EMPTY;
    }

    return this.getPreSignedUrl(file.name).pipe(
      switchMap((url) =>
        this.http.put(url, file, {
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Content-Type': 'text/csv',
          },
        })
      ),
      // eslint-disable-next-line rxjs/no-implicit-any-catch
      catchError((err) => {
        if (err.status === 401) {
          this.notificationService.showError(
            'Unauthorized - the request has not been applied because it lacks valid authentication credentials for the target resource'
          );
        } else if (err.status === 403) {
          this.notificationService.showError(
            'Forbidden - you do not have permission to access this resource'
          );
        }

        return throwError(() => err);
      })
    );
  }

  private getPreSignedUrl(fileName: string): Observable<string> {
    const url = this.getUrl('import', 'import');
    const authorizationToken = localStorage.getItem('authorization_token');

    return this.http.get<string>(url, {
      params: {
        name: fileName,
      },
      headers: {
        authorization: `Basic ${authorizationToken}`,
      },
    });
  }
}
