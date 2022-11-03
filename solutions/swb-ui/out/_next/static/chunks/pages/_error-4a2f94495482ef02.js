(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [820],
  {
    3184: function (e, t, r) {
      'use strict';
      var n = r(1565),
        o = r(9717),
        i = r(7971),
        l = r(6927),
        a = r(2503);
      function c(e) {
        var t = (function () {
          if ('undefined' === typeof Reflect || !Reflect.construct) return !1;
          if (Reflect.construct.sham) return !1;
          if ('function' === typeof Proxy) return !0;
          try {
            return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})), !0;
          } catch (e) {
            return !1;
          }
        })();
        return function () {
          var r,
            n = a(e);
          if (t) {
            var o = a(this).constructor;
            r = Reflect.construct(n, arguments, o);
          } else r = n.apply(this, arguments);
          return l(this, r);
        };
      }
      Object.defineProperty(t, '__esModule', { value: !0 }), (t.default = void 0);
      var u = d(r(6393)),
        s = d(r(3311));
      function d(e) {
        return e && e.__esModule ? e : { default: e };
      }
      var f = {
        400: 'Bad Request',
        404: 'This page could not be found',
        405: 'Method Not Allowed',
        500: 'Internal Server Error'
      };
      function p(e) {
        var t = e.res,
          r = e.err;
        return { statusCode: t && t.statusCode ? t.statusCode : r ? r.statusCode : 404 };
      }
      var h = (function (e) {
        i(r, e);
        var t = c(r);
        function r() {
          return n(this, r), t.apply(this, arguments);
        }
        return (
          o(r, [
            {
              key: 'render',
              value: function () {
                var e = this.props.statusCode,
                  t = this.props.title || f[e] || 'An unexpected error has occurred';
                return u.default.createElement(
                  'div',
                  { style: g.error },
                  u.default.createElement(
                    s.default,
                    null,
                    u.default.createElement(
                      'title',
                      null,
                      e
                        ? ''.concat(e, ': ').concat(t)
                        : 'Application error: a client-side exception has occurred'
                    )
                  ),
                  u.default.createElement(
                    'div',
                    null,
                    u.default.createElement('style', {
                      dangerouslySetInnerHTML: {
                        __html:
                          '\n                body { margin: 0; color: #000; background: #fff; }\n                .next-error-h1 {\n                  border-right: 1px solid rgba(0, 0, 0, .3);\n                }\n                @media (prefers-color-scheme: dark) {\n                  body { color: #fff; background: #000; }\n                  .next-error-h1 {\n                    border-right: 1px solid rgba(255, 255, 255, .3);\n                  }\n                }'
                      }
                    }),
                    e ? u.default.createElement('h1', { className: 'next-error-h1', style: g.h1 }, e) : null,
                    u.default.createElement(
                      'div',
                      { style: g.desc },
                      u.default.createElement(
                        'h2',
                        { style: g.h2 },
                        this.props.title || e
                          ? t
                          : u.default.createElement(
                              u.default.Fragment,
                              null,
                              'Application error: a client-side exception has occurred (see the browser console for more information)'
                            ),
                        '.'
                      )
                    )
                  )
                );
              }
            }
          ]),
          r
        );
      })(u.default.Component);
      (t.default = h), (h.displayName = 'ErrorPage'), (h.getInitialProps = p), (h.origGetInitialProps = p);
      var g = {
        error: {
          fontFamily:
            '-apple-system, BlinkMacSystemFont, Roboto, "Segoe UI", "Fira Sans", Avenir, "Helvetica Neue", "Lucida Grande", sans-serif',
          height: '100vh',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        },
        desc: {
          display: 'inline-block',
          textAlign: 'left',
          lineHeight: '49px',
          height: '49px',
          verticalAlign: 'middle'
        },
        h1: {
          display: 'inline-block',
          margin: 0,
          marginRight: '20px',
          padding: '10px 23px 10px 0',
          fontSize: '24px',
          fontWeight: 500,
          verticalAlign: 'top'
        },
        h2: { fontSize: '14px', fontWeight: 'normal', lineHeight: 'inherit', margin: 0, padding: 0 }
      };
    },
    1879: function (e, t, r) {
      (window.__NEXT_P = window.__NEXT_P || []).push([
        '/_error',
        function () {
          return r(3184);
        }
      ]);
    }
  },
  function (e) {
    e.O(0, [774, 888, 179], function () {
      return (t = 1879), e((e.s = t));
      var t;
    });
    var t = e.O();
    _N_E = t;
  }
]);
