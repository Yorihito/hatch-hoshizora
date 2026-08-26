export const metadata = {
  title: '星空マップ',
  description: '自分の場所から見える星空をシミュレーションできるWebアプリ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, padding: 0, background: '#050d18' }}>{children}</body>
    </html>
  )
}
