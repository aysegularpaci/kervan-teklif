import Foundation
import PDFKit
import AppKit

let args = CommandLine.arguments
guard args.count == 3, let doc = PDFDocument(url: URL(fileURLWithPath: args[1])) else { exit(1) }
let output = args[2]
try? FileManager.default.createDirectory(atPath: output, withIntermediateDirectories: true)
for index in 0..<doc.pageCount {
  guard let page = doc.page(at: index) else { continue }
  let box = page.bounds(for: .mediaBox)
  let scale: CGFloat = 2
  let image = NSImage(size: NSSize(width: box.width * scale, height: box.height * scale))
  image.lockFocus()
  NSColor.white.setFill(); NSRect(origin: .zero, size: image.size).fill()
  guard let context = NSGraphicsContext.current?.cgContext else { image.unlockFocus(); continue }
  context.saveGState(); context.scaleBy(x: scale, y: scale); page.draw(with: .mediaBox, to: context); context.restoreGState()
  image.unlockFocus()
  guard let data = image.tiffRepresentation, let bitmap = NSBitmapImageRep(data: data), let png = bitmap.representation(using: .png, properties: [:]) else { continue }
  try png.write(to: URL(fileURLWithPath: "\(output)/page-\(index + 1).png"))
}
print(doc.pageCount)
