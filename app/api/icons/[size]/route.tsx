import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeStr } = await params;
  const size = parseInt(sizeStr, 10) || 192;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #1E63FF 0%, #7B3CFF 50%, #D6308F 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: size * 0.48,
            fontWeight: 700,
            letterSpacing: '-0.04em',
          }}
        >
          M
        </span>
      </div>
    ),
    { width: size, height: size }
  );
}
