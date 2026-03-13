import React, { Suspense } from 'react';
import Packagesclient from './Packagesclient';

export default function page() {
    return (
        <div>
            <Suspense>
                <Packagesclient />
            </Suspense>
        </div>
    );
}
